// ─── Data Models ──────────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  title: string;
  intent_keywords: string[];
  short_answer: string;
  tags: string[];
  frameworks: string[];
  owner: string;
  last_reviewed: string; // ISO date string YYYY-MM-DD
  evidence_ids: string[];
  // long_answer content lives in <id>.md alongside the YAML
  long_answer_md?: string;
}

export interface Evidence {
  id: string;
  title: string;
  type: 'doc' | 'link' | 'file';
  url_or_path: string;
  description: string;
  last_updated: string; // ISO date string YYYY-MM-DD
  tags: string[];
}

export interface Question {
  qid: string;
  text: string;
  section: string;
  answer_type: 'yes_no' | 'yes_no_na' | 'text' | 'select';
}

export interface Questionnaire {
  slug: string;
  source_filename: string;
  imported_at: string; // ISO datetime
  questions: Question[];
}

export interface MappingEntry {
  answer_id: string | null;
  override_text?: string;
}

export type Mapping = Record<string, MappingEntry>;

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionData {
  github_access_token: string;
  github_username: string;
  github_avatar?: string;
  selected_repo?: string; // "owner/repo"
  iat?: number;
  exp?: number;
}

// ─── License ──────────────────────────────────────────────────────────────────

export interface LicensePayload {
  customer_name: string;
  allowed_repo: string; // "owner/repo" or "*" for any
  issued_at: number;    // unix timestamp
  expiry?: number;      // unix timestamp (absent = never expires)
}

export interface LicenseResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

export interface LicenseStatus {
  demo: boolean;
  customer_name?: string;
  allowed_repo?: string;
  expiry?: number;
  error?: string;
}

// ─── Staleness ────────────────────────────────────────────────────────────────

export interface StaleAnswer {
  id: string;
  title: string;
  last_reviewed: string;
  days_stale: number;
}

export interface StaleEvidence {
  id: string;
  title: string;
  last_updated: string;
  days_stale: number;
}

export interface StaleReport {
  stale_answers: StaleAnswer[];
  stale_evidence: StaleEvidence[];
  generated_at: string;
  answer_threshold_days: number;
  evidence_threshold_days: number;
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

export interface PRResult {
  url: string;
  number: number;
  branch: string;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportRow {
  qid: string;
  section: string;
  question: string;
  answer_id: string;
  answer_title: string;
  short_answer: string;
  long_answer: string;
  override_text: string;
  evidence_ids: string;
}

export interface EvidenceIndexRow {
  qid: string;
  section: string;
  question: string;
  evidence_id: string;
  evidence_title: string;
  evidence_type: string;
  evidence_url: string;
  evidence_description: string;
}

// ─── Import ───────────────────────────────────────────────────────────────────

export type RawImportRow = Record<string, string>;

// ─── Demo limits ──────────────────────────────────────────────────────────────

export const DEMO_LIMITS = {
  MAX_ANSWERS: 20,
  MAX_EVIDENCE: 10,
  MAX_QUESTIONNAIRES: 1,
  MAX_QUESTIONS: 30,
  WATERMARK: 'DEMO – NOT FOR SUBMISSION',
} as const;
