import { describe, it, expect } from 'vitest';
import {
  buildExportRows,
  buildEvidenceIndexRows,
  exportToCSV,
  computeStaleness,
  rankAnswersForQuestion,
} from '../lib/export';
import { importFromCSV } from '../lib/import';
import type { Answer, Evidence, Mapping, Questionnaire } from '../lib/types';
import { DEMO_LIMITS } from '../lib/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const answers: Answer[] = [
  {
    id: 'ans-001',
    title: 'Encryption at Rest',
    intent_keywords: ['AES', 'encryption', 'at rest'],
    short_answer: 'All customer data is encrypted at rest using AES-256.',
    long_answer_md: '## Encryption\n\nAES-256-GCM.',
    tags: ['encryption'],
    frameworks: ['SOC2'],
    owner: 'sec@test.com',
    last_reviewed: '2025-01-01',
    evidence_ids: ['ev-001'],
  },
  {
    id: 'ans-002',
    title: 'Incident Response',
    intent_keywords: ['incident', 'IRP', 'breach'],
    short_answer: 'We have a documented IRP tested annually.',
    tags: ['incident-response'],
    frameworks: ['SOC2'],
    owner: 'sec@test.com',
    last_reviewed: '2025-01-01',
    evidence_ids: ['ev-002'],
  },
];

const evidence: Evidence[] = [
  { id: 'ev-001', title: 'SOC 2 Report', type: 'doc', url_or_path: 'https://trust.example.com', description: 'Annual SOC 2 Type II report.', last_updated: '2025-01-01', tags: ['SOC2'] },
  { id: 'ev-002', title: 'IRP Document', type: 'file', url_or_path: 'evidence/files/irp.pdf', description: 'Incident Response Plan document.', last_updated: '2025-01-01', tags: ['incident-response'] },
];

const questionnaire: Questionnaire = {
  slug: 'test-q',
  source_filename: 'test.csv',
  imported_at: '2025-06-01T00:00:00.000Z',
  questions: [
    { qid: 'Q1', text: 'Is data at rest encrypted?', section: 'Crypto', answer_type: 'yes_no' },
    { qid: 'Q2', text: 'Do you have an incident response plan?', section: 'Operations', answer_type: 'yes_no' },
    { qid: 'Q3', text: 'Unmapped question', section: 'Other', answer_type: 'text' },
  ],
};

const mapping: Mapping = {
  Q1: { answer_id: 'ans-001' },
  Q2: { answer_id: 'ans-002', override_text: 'Custom IRP answer.' },
  Q3: { answer_id: null },
};

// ─── buildExportRows ──────────────────────────────────────────────────────────

describe('buildExportRows', () => {
  it('returns one row per question', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    expect(rows).toHaveLength(3);
  });

  it('uses override_text when present', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const q2 = rows.find((r) => r.qid === 'Q2')!;
    expect(q2.short_answer).toBe('Custom IRP answer.');
  });

  it('falls back to short_answer when no override', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const q1 = rows.find((r) => r.qid === 'Q1')!;
    expect(q1.short_answer).toBe('All customer data is encrypted at rest using AES-256.');
  });

  it('leaves unmapped questions empty', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const q3 = rows.find((r) => r.qid === 'Q3')!;
    expect(q3.answer_id).toBe('');
  });

  it('hides long_answer in demo mode', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, true);
    const q1 = rows.find((r) => r.qid === 'Q1')!;
    expect(q1.long_answer).toBe('');
  });

  it('includes long_answer in paid mode', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const q1 = rows.find((r) => r.qid === 'Q1')!;
    expect(q1.long_answer).toContain('AES-256');
  });
});

// ─── exportToCSV ─────────────────────────────────────────────────────────────

describe('exportToCSV', () => {
  it('returns CSV string with header', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const csv = exportToCSV(rows, false);
    expect(csv).toContain('qid');
    expect(csv).toContain('Q1');
  });

  it('adds watermark column in demo mode', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, true);
    const csv = exportToCSV(rows, true);
    expect(csv).toContain(DEMO_LIMITS.WATERMARK);
  });

  it('does not include watermark in paid mode', () => {
    const rows = buildExportRows(questionnaire, mapping, answers, false);
    const csv = exportToCSV(rows, false);
    expect(csv).not.toContain(DEMO_LIMITS.WATERMARK);
  });
});

// ─── buildEvidenceIndexRows ───────────────────────────────────────────────────

describe('buildEvidenceIndexRows', () => {
  it('returns evidence rows for mapped questions', () => {
    const rows = buildEvidenceIndexRows(questionnaire, mapping, answers, evidence);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('includes correct evidence data', () => {
    const rows = buildEvidenceIndexRows(questionnaire, mapping, answers, evidence);
    const evRow = rows.find((r) => r.evidence_id === 'ev-001');
    expect(evRow).toBeDefined();
    expect(evRow!.evidence_title).toBe('SOC 2 Report');
  });

  it('skips unmapped questions', () => {
    const rows = buildEvidenceIndexRows(questionnaire, mapping, answers, evidence);
    const q3Rows = rows.filter((r) => r.qid === 'Q3');
    expect(q3Rows).toHaveLength(0);
  });
});

// ─── computeStaleness ────────────────────────────────────────────────────────

describe('computeStaleness', () => {
  it('correctly identifies stale answers', () => {
    const oldAnswer: Answer = {
      ...answers[0],
      id: 'ans-old',
      last_reviewed: '2020-01-01', // very stale
    };
    const report = computeStaleness([oldAnswer, ...answers], evidence, 180, 365);
    expect(report.stale_answers.some((a) => a.id === 'ans-old')).toBe(true);
  });

  it('does not flag recently reviewed answers', () => {
    const fresh = answers.map((a) => ({ ...a, last_reviewed: new Date().toISOString().split('T')[0] }));
    const report = computeStaleness(fresh, evidence, 180, 365);
    expect(report.stale_answers).toHaveLength(0);
  });
});

// ─── rankAnswersForQuestion ───────────────────────────────────────────────────

describe('rankAnswersForQuestion', () => {
  it('returns top matching answers', () => {
    const results = rankAnswersForQuestion('Is data at rest encrypted using AES?', answers, 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].answer.id).toBe('ans-001');
  });

  it('returns higher score for better keyword match', () => {
    const results = rankAnswersForQuestion('incident response breach notification', answers, 3);
    const irpResult = results.find((r) => r.answer.id === 'ans-002');
    const encResult = results.find((r) => r.answer.id === 'ans-001');
    if (irpResult && encResult) {
      expect(irpResult.score).toBeGreaterThan(encResult.score);
    }
  });

  it('returns empty array for unrelated question', () => {
    const results = rankAnswersForQuestion('xyzzyx qqqq zzzzz', answers, 3);
    expect(results).toHaveLength(0);
  });
});

// ─── importFromCSV ────────────────────────────────────────────────────────────

describe('importFromCSV', () => {
  const csv = `qid,section,text,answer_type
A.1,Access Control,"Does your org use RBAC?",yes_no
A.2,Access Control,"Describe your MFA policy.",text
B.1,Crypto,"Is data at rest encrypted?",yes_no`;

  it('parses CSV into questionnaire', () => {
    const q = importFromCSV(csv, 'test.csv');
    expect(q.questions).toHaveLength(3);
    expect(q.slug).toBe('test');
  });

  it('respects maxQuestions limit', () => {
    const q = importFromCSV(csv, 'test.csv', 2);
    expect(q.questions).toHaveLength(2);
  });

  it('normalises question text', () => {
    const q = importFromCSV(csv, 'test.csv');
    expect(q.questions[0].text).toBe('Does your org use RBAC?');
  });

  it('parses flexible column names', () => {
    const flexCsv = `question,category,answer
"Do you use TLS?",Crypto,yes_no
"Do you back up data?",Operations,yes_no`;
    const q = importFromCSV(flexCsv, 'flexible.csv');
    expect(q.questions).toHaveLength(2);
    expect(q.questions[0].section).toBe('Crypto');
  });

  it('auto-assigns QIDs when column is missing', () => {
    const noQidCsv = `text,section\n"Question 1",Access\n"Question 2",Crypto`;
    const q = importFromCSV(noQidCsv, 'no-qid.csv');
    expect(q.questions[0].qid).toBe('Q001');
  });

  it('sets default answer_type when column absent', () => {
    const q = importFromCSV('text,section\n"Q text",Section', 'minimal.csv');
    expect(q.questions[0].answer_type).toBe('text');
  });
});
