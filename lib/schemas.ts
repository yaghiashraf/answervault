import { z } from 'zod';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const AnswerSchema = z.object({
  id: z.string().regex(/^ans-\d{3,}$/, 'ID must be ans-NNN format'),
  title: z.string().min(3).max(200),
  intent_keywords: z.array(z.string()).min(1),
  short_answer: z.string().min(10).max(1000),
  tags: z.array(z.string()),
  frameworks: z.array(z.string()),
  owner: z.string().min(1),
  last_reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  evidence_ids: z.array(z.string()),
  long_answer_md: z.string().optional(),
});

export const EvidenceSchema = z.object({
  id: z.string().regex(/^ev-\d{3,}$/, 'ID must be ev-NNN format'),
  title: z.string().min(3).max(200),
  type: z.enum(['doc', 'link', 'file']),
  url_or_path: z.string().min(1),
  description: z.string().min(10).max(2000),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  tags: z.array(z.string()),
});

export const QuestionSchema = z.object({
  qid: z.string().min(1),
  text: z.string().min(5),
  section: z.string().min(1),
  answer_type: z.enum(['yes_no', 'yes_no_na', 'text', 'select']),
});

export const QuestionnaireSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  source_filename: z.string(),
  imported_at: z.string(),
  questions: z.array(QuestionSchema).min(1),
});

export const MappingEntrySchema = z.object({
  answer_id: z.string().nullable(),
  override_text: z.string().optional(),
});

export const MappingSchema = z.record(MappingEntrySchema);

// ─── Validate helpers ─────────────────────────────────────────────────────────

export function validateAnswer(data: unknown) {
  return AnswerSchema.safeParse(data);
}

export function validateEvidence(data: unknown) {
  return EvidenceSchema.safeParse(data);
}

export function validateQuestionnaire(data: unknown) {
  return QuestionnaireSchema.safeParse(data);
}

export function validateMapping(data: unknown) {
  return MappingSchema.safeParse(data);
}

// ─── Type exports from Zod ────────────────────────────────────────────────────
export type AnswerInput = z.infer<typeof AnswerSchema>;
export type EvidenceInput = z.infer<typeof EvidenceSchema>;
export type QuestionnaireInput = z.infer<typeof QuestionnaireSchema>;
export type MappingInput = z.infer<typeof MappingSchema>;
