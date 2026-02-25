import { Octokit } from '@octokit/rest';
import yaml from 'js-yaml';
import type {
  Answer,
  Evidence,
  GitHubRepo,
  Mapping,
  PRResult,
  Questionnaire,
} from './types';

// Simple in-memory cache with TTL
interface CacheEntry<T> { value: T; expires: number }
const cache = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheGet<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (!e || Date.now() > e.expires) { cache.delete(key); return undefined; }
  return e.value as T;
}
function cacheSet<T>(key: string, value: T) {
  cache.set(key, { value, expires: Date.now() + TTL_MS });
}
function cacheInvalidate(prefix: string) {
  for (const k of Array.from(cache.keys())) { if (k.startsWith(prefix)) cache.delete(k); }
}

export function parseRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  return { owner, repo };
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, repoFullName: string) {
    this.octokit = new Octokit({ auth: token });
    const { owner, repo } = parseRepo(repoFullName);
    this.owner = owner;
    this.repo = repo;
  }

  // ── Low-level file operations ─────────────────────────────────────────────

  async getFileContent(path: string): Promise<string | null> {
    const cacheKey = `${this.owner}/${this.repo}:${path}`;
    const cached = cacheGet<string>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner, repo: this.repo, path,
      });
      if (Array.isArray(data) || data.type !== 'file') return null;
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      cacheSet(cacheKey, content);
      return content;
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  }

  async getFileSha(path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner, repo: this.repo, path,
      });
      if (Array.isArray(data)) return null;
      return (data as { sha: string }).sha ?? null;
    } catch {
      return null;
    }
  }

  async listDirectory(path: string): Promise<string[]> {
    const cacheKey = `dir:${this.owner}/${this.repo}:${path}`;
    const cached = cacheGet<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner, repo: this.repo, path,
      });
      if (!Array.isArray(data)) return [];
      const names = data.map((f) => f.name);
      cacheSet(cacheKey, names);
      return names;
    } catch {
      return [];
    }
  }

  async getDefaultBranch(): Promise<string> {
    const { data } = await this.octokit.rest.repos.get({
      owner: this.owner, repo: this.repo,
    });
    return data.default_branch;
  }

  // ── Branch / PR operations (paid mode) ───────────────────────────────────

  async createBranch(branchName: string): Promise<void> {
    const defaultBranch = await this.getDefaultBranch();
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner: this.owner, repo: this.repo,
      ref: `heads/${defaultBranch}`,
    });
    await this.octokit.rest.git.createRef({
      owner: this.owner, repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });
  }

  async commitFile(
    branchName: string,
    path: string,
    content: string,
    message: string,
  ): Promise<void> {
    const existingSha = await this.getFileSha(path);
    const encoded = Buffer.from(content, 'utf8').toString('base64');

    const params: Parameters<typeof this.octokit.rest.repos.createOrUpdateFileContents>[0] = {
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: encoded,
      branch: branchName,
    };
    if (existingSha) params.sha = existingSha;

    await this.octokit.rest.repos.createOrUpdateFileContents(params);
    // Invalidate cache for this path
    cacheInvalidate(`${this.owner}/${this.repo}:${path}`);
    cacheInvalidate(`dir:${this.owner}/${this.repo}`);
  }

  async openPR(
    branchName: string,
    title: string,
    body: string,
  ): Promise<PRResult> {
    const defaultBranch = await this.getDefaultBranch();
    const { data } = await this.octokit.rest.pulls.create({
      owner: this.owner, repo: this.repo,
      title,
      body,
      head: branchName,
      base: defaultBranch,
    });
    return {
      url: data.html_url,
      number: data.number,
      branch: branchName,
    };
  }

  async openIssue(title: string, body: string): Promise<string> {
    const { data } = await this.octokit.rest.issues.create({
      owner: this.owner, repo: this.repo, title, body,
    });
    return data.html_url;
  }

  // ── Answer Library ────────────────────────────────────────────────────────

  async listAnswers(): Promise<Answer[]> {
    const files = await this.listDirectory('answers');
    const ymlFiles = files.filter((f) => f.endsWith('.yml'));
    const answers: Answer[] = [];

    for (const file of ymlFiles) {
      const raw = await this.getFileContent(`answers/${file}`);
      if (!raw) continue;
      const parsed = yaml.load(raw) as Answer;

      // Load long answer markdown
      const mdFile = file.replace('.yml', '.md');
      if (files.includes(mdFile)) {
        parsed.long_answer_md = await this.getFileContent(`answers/${mdFile}`) ?? '';
      }
      answers.push(parsed);
    }
    return answers;
  }

  async getAnswer(id: string): Promise<Answer | null> {
    const raw = await this.getFileContent(`answers/${id}.yml`);
    if (!raw) return null;
    const answer = yaml.load(raw) as Answer;
    answer.long_answer_md = await this.getFileContent(`answers/${id}.md`) ?? '';
    return answer;
  }

  /** Paid mode: create/update answer via PR */
  async upsertAnswerViaPR(answer: Answer, isNew: boolean): Promise<PRResult> {
    const branch = `answervault/answer-${answer.id}-${Date.now()}`;
    const { long_answer_md, ...meta } = answer;

    await this.createBranch(branch);

    const yamlContent = yaml.dump(meta, { lineWidth: 120 });
    await this.commitFile(
      branch,
      `answers/${answer.id}.yml`,
      yamlContent,
      `${isNew ? 'Add' : 'Update'} answer: ${answer.title}`,
    );

    if (long_answer_md !== undefined) {
      await this.commitFile(
        branch,
        `answers/${answer.id}.md`,
        long_answer_md,
        `${isNew ? 'Add' : 'Update'} long answer: ${answer.title}`,
      );
    }

    return this.openPR(
      branch,
      `${isNew ? 'Add' : 'Update'} answer: ${answer.title}`,
      `AnswerVault automated PR\n\n**Answer ID:** \`${answer.id}\`\n**Title:** ${answer.title}\n\nMerge to publish this answer to the library.`,
    );
  }

  // ── Evidence Catalog ──────────────────────────────────────────────────────

  async listEvidence(): Promise<Evidence[]> {
    const raw = await this.getFileContent('evidence/evidence.yml');
    if (!raw) return [];
    return (yaml.load(raw) as Evidence[]) ?? [];
  }

  /** Paid mode: update evidence.yml via PR */
  async upsertEvidenceViaPR(evidence: Evidence[], updatedItem: Evidence): Promise<PRResult> {
    const branch = `answervault/evidence-${updatedItem.id}-${Date.now()}`;
    const existing = evidence.findIndex((e) => e.id === updatedItem.id);
    const updated = [...evidence];
    if (existing >= 0) updated[existing] = updatedItem;
    else updated.push(updatedItem);

    await this.createBranch(branch);
    await this.commitFile(
      branch,
      'evidence/evidence.yml',
      yaml.dump(updated, { lineWidth: 120 }),
      `Update evidence: ${updatedItem.title}`,
    );

    return this.openPR(
      branch,
      `Update evidence: ${updatedItem.title}`,
      `AnswerVault automated PR\n\n**Evidence ID:** \`${updatedItem.id}\`\n**Title:** ${updatedItem.title}\n\nMerge to publish evidence update.`,
    );
  }

  // ── Questionnaires ────────────────────────────────────────────────────────

  async listQuestionnaires(): Promise<Questionnaire[]> {
    const dirs = await this.listDirectory('questionnaires');
    const questionnaires: Questionnaire[] = [];

    for (const dir of dirs) {
      const raw = await this.getFileContent(`questionnaires/${dir}/questionnaire.json`);
      if (!raw) continue;
      questionnaires.push(JSON.parse(raw) as Questionnaire);
    }
    return questionnaires;
  }

  async getQuestionnaire(slug: string): Promise<Questionnaire | null> {
    const raw = await this.getFileContent(`questionnaires/${slug}/questionnaire.json`);
    if (!raw) return null;
    return JSON.parse(raw) as Questionnaire;
  }

  /** Paid mode: save questionnaire via PR */
  async saveQuestionnaireViaPR(q: Questionnaire): Promise<PRResult> {
    const branch = `answervault/questionnaire-${q.slug}-${Date.now()}`;
    await this.createBranch(branch);
    await this.commitFile(
      branch,
      `questionnaires/${q.slug}/questionnaire.json`,
      JSON.stringify(q, null, 2),
      `Import questionnaire: ${q.slug}`,
    );
    return this.openPR(
      branch,
      `Import questionnaire: ${q.slug}`,
      `AnswerVault automated PR\n\n**Questionnaire:** \`${q.slug}\`\n**Questions:** ${q.questions.length}\n\nMerge to add this questionnaire to the vault.`,
    );
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

  async getMapping(slug: string): Promise<Mapping> {
    const raw = await this.getFileContent(`questionnaires/${slug}/mapping.yml`);
    if (!raw) return {};
    return (yaml.load(raw) as Mapping) ?? {};
  }

  /** Paid mode: save mapping via PR */
  async saveMappingViaPR(slug: string, mapping: Mapping): Promise<PRResult> {
    const branch = `answervault/mapping-${slug}-${Date.now()}`;
    await this.createBranch(branch);
    await this.commitFile(
      branch,
      `questionnaires/${slug}/mapping.yml`,
      yaml.dump(mapping, { lineWidth: 120 }),
      `Update mapping for questionnaire: ${slug}`,
    );
    return this.openPR(
      branch,
      `Update mapping: ${slug}`,
      `AnswerVault automated PR\n\n**Questionnaire:** \`${slug}\`\n\nMapping update – merge to persist.`,
    );
  }

  // ── Repo listing (for repo selector) ─────────────────────────────────────

  async listUserRepos(): Promise<GitHubRepo[]> {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated', per_page: 100, type: 'all',
    });
    return data.map((r) => ({
      owner: r.owner.login,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
    }));
  }
}

/** Build a GitHubClient from session data (helper) */
export function clientFromSession(
  token: string,
  repoFullName: string,
): GitHubClient {
  return new GitHubClient(token, repoFullName);
}
