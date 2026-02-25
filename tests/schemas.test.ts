import { describe, it, expect } from 'vitest';
import {
  validateAnswer,
  validateEvidence,
  validateQuestionnaire,
  validateMapping,
} from '../lib/schemas';

// ─── Answer ───────────────────────────────────────────────────────────────────

describe('Answer schema', () => {
  const valid = {
    id: 'ans-001',
    title: 'Encryption at Rest',
    intent_keywords: ['AES', 'encryption', 'at rest'],
    short_answer: 'All customer data is encrypted at rest using AES-256-GCM.',
    tags: ['encryption'],
    frameworks: ['SOC2'],
    owner: 'security@example.com',
    last_reviewed: '2025-01-01',
    evidence_ids: ['ev-001'],
  };

  it('accepts a valid answer', () => {
    const result = validateAnswer(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid ID format', () => {
    const result = validateAnswer({ ...valid, id: 'answer-1' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing title', () => {
    const { title: _, ...noTitle } = valid;
    const result = validateAnswer(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects empty intent_keywords', () => {
    const result = validateAnswer({ ...valid, intent_keywords: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid date format', () => {
    const result = validateAnswer({ ...valid, last_reviewed: '01/01/2025' });
    expect(result.success).toBe(false);
  });

  it('rejects a short_answer that is too short', () => {
    const result = validateAnswer({ ...valid, short_answer: 'Yes.' });
    expect(result.success).toBe(false);
  });
});

// ─── Evidence ─────────────────────────────────────────────────────────────────

describe('Evidence schema', () => {
  const valid = {
    id: 'ev-001',
    title: 'SOC 2 Type II Report',
    type: 'doc' as const,
    url_or_path: 'https://trust.example.com/soc2',
    description: 'Annual SOC 2 Type II audit report covering Security and Availability.',
    last_updated: '2025-01-01',
    tags: ['SOC2', 'audit'],
  };

  it('accepts valid evidence', () => {
    expect(validateEvidence(valid).success).toBe(true);
  });

  it('rejects invalid id format', () => {
    expect(validateEvidence({ ...valid, id: 'evidence-1' }).success).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(validateEvidence({ ...valid, type: 'spreadsheet' }).success).toBe(false);
  });

  it('rejects all types: doc, link, file are valid', () => {
    expect(validateEvidence({ ...valid, type: 'doc' }).success).toBe(true);
    expect(validateEvidence({ ...valid, type: 'link' }).success).toBe(true);
    expect(validateEvidence({ ...valid, type: 'file' }).success).toBe(true);
  });
});

// ─── Questionnaire ────────────────────────────────────────────────────────────

describe('Questionnaire schema', () => {
  const valid = {
    slug: 'acme-sig-2025',
    source_filename: 'SIG-Lite.csv',
    imported_at: '2025-06-01T00:00:00.000Z',
    questions: [
      { qid: 'A.1', text: 'Does your organization implement RBAC?', section: 'Access Control', answer_type: 'yes_no' as const },
    ],
  };

  it('accepts a valid questionnaire', () => {
    expect(validateQuestionnaire(valid).success).toBe(true);
  });

  it('rejects a slug with uppercase', () => {
    expect(validateQuestionnaire({ ...valid, slug: 'Acme-SIG' }).success).toBe(false);
  });

  it('rejects empty questions array', () => {
    expect(validateQuestionnaire({ ...valid, questions: [] }).success).toBe(false);
  });

  it('rejects invalid answer_type', () => {
    const badQ = { ...valid, questions: [{ ...valid.questions[0], answer_type: 'free_text' }] };
    expect(validateQuestionnaire(badQ).success).toBe(false);
  });
});

// ─── Mapping ──────────────────────────────────────────────────────────────────

describe('Mapping schema', () => {
  it('accepts a valid mapping', () => {
    const mapping = {
      'A.1': { answer_id: 'ans-001' },
      'A.2': { answer_id: null },
      'B.1': { answer_id: 'ans-002', override_text: 'Custom answer text here.' },
    };
    expect(validateMapping(mapping).success).toBe(true);
  });

  it('accepts null answer_id (unmapped question)', () => {
    expect(validateMapping({ 'Q1': { answer_id: null } }).success).toBe(true);
  });

  it('accepts empty mapping', () => {
    expect(validateMapping({}).success).toBe(true);
  });
});
