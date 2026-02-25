#!/usr/bin/env node
/**
 * Weekly staleness check.
 * Opens (or updates) a GitHub Issue listing stale answers and evidence items.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
const token = process.env.GITHUB_TOKEN;
const repoFull = process.env.GITHUB_REPOSITORY;
const answerDays = Number(process.env.STALE_ANSWER_DAYS ?? 180);
const evidenceDays = Number(process.env.STALE_EVIDENCE_DAYS ?? 365);

if (!token || !repoFull) {
  console.error('Missing GITHUB_TOKEN or GITHUB_REPOSITORY env vars');
  process.exit(1);
}

const [owner, repo] = repoFull.split('/');
const now = Date.now();
const DAY = 86400 * 1000;

// ── Load data ─────────────────────────────────────────────────────────────────

function loadAnswers() {
  const dir = path.join(root, 'answers');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yml'))
    .map((f) => yaml.load(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function loadEvidence() {
  const p = path.join(root, 'evidence', 'evidence.yml');
  if (!fs.existsSync(p)) return [];
  return yaml.load(fs.readFileSync(p, 'utf8')) ?? [];
}

const answers = loadAnswers();
const evidence = loadEvidence();

const staleAnswers = answers
  .map((a) => ({ ...a, days: Math.floor((now - new Date(a.last_reviewed).getTime()) / DAY) }))
  .filter((a) => a.days > answerDays)
  .sort((a, b) => b.days - a.days);

const staleEvidence = evidence
  .map((e) => ({ ...e, days: Math.floor((now - new Date(e.last_updated).getTime()) / DAY) }))
  .filter((e) => e.days > evidenceDays)
  .sort((a, b) => b.days - a.days);

if (staleAnswers.length === 0 && staleEvidence.length === 0) {
  console.log('✅ No stale items found. All up to date!');
  process.exit(0);
}

// ── Build issue body ──────────────────────────────────────────────────────────

const lines = [
  '## AnswerVault Weekly Staleness Report',
  '',
  `Generated: ${new Date().toISOString().split('T')[0]}`,
  `Thresholds: Answers >${answerDays} days · Evidence >${evidenceDays} days`,
  '',
];

if (staleAnswers.length > 0) {
  lines.push(`### 📚 Stale Answers (${staleAnswers.length})`, '');
  lines.push('| ID | Title | Last Reviewed | Days Overdue |');
  lines.push('|----|-------|---------------|-------------|');
  for (const a of staleAnswers) {
    lines.push(`| \`${a.id}\` | ${a.title} | ${a.last_reviewed} | ${a.days - answerDays}d |`);
  }
  lines.push('');
}

if (staleEvidence.length > 0) {
  lines.push(`### 📎 Stale Evidence (${staleEvidence.length})`, '');
  lines.push('| ID | Title | Last Updated | Days Overdue |');
  lines.push('|----|-------|--------------|-------------|');
  for (const e of staleEvidence) {
    lines.push(`| \`${e.id}\` | ${e.title} | ${e.last_updated} | ${e.days - evidenceDays}d |`);
  }
  lines.push('');
}

lines.push('---');
lines.push('*Close this issue after all items have been reviewed and `last_reviewed` / `last_updated` dates updated.*');

const body = lines.join('\n');
const title = `[AnswerVault] Staleness Report – ${new Date().toISOString().split('T')[0]}`;

// ── GitHub API helper ─────────────────────────────────────────────────────────

function ghRequest(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AnswerVault-Bot',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Create or update issue ────────────────────────────────────────────────────

async function run() {
  // Find open issues with [AnswerVault] in title
  const { data: issues } = await ghRequest('GET', '/issues?state=open&labels=answervault-stale&per_page=5');

  if (Array.isArray(issues) && issues.length > 0) {
    // Update existing issue
    const issue = issues[0];
    await ghRequest('PATCH', `/issues/${issue.number}`, { title, body });
    console.log(`✅ Updated existing issue #${issue.number}`);
  } else {
    // Create new issue
    const { data: newIssue } = await ghRequest('POST', '/issues', {
      title, body, labels: ['answervault-stale'],
    });
    console.log(`✅ Created issue #${newIssue.number}: ${newIssue.html_url}`);
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
