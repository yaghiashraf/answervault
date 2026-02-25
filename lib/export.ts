/**
 * Export: Completed Questionnaire + Evidence Index
 * Formats: CSV (demo + paid), XLSX (paid only)
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type {
  Answer,
  Evidence,
  EvidenceIndexRow,
  ExportRow,
  Mapping,
  Questionnaire,
} from './types';
import { DEMO_LIMITS } from './types';

// ─── Build export rows ────────────────────────────────────────────────────────

export function buildExportRows(
  questionnaire: Questionnaire,
  mapping: Mapping,
  answers: Answer[],
  isDemo: boolean,
): ExportRow[] {
  const answerMap = new Map(answers.map((a) => [a.id, a]));

  return questionnaire.questions.map((q) => {
    const entry = mapping[q.qid];
    const answer = entry?.answer_id ? answerMap.get(entry.answer_id) : undefined;

    return {
      qid: q.qid,
      section: q.section,
      question: q.text,
      answer_id: answer?.id ?? '',
      answer_title: answer?.title ?? '',
      short_answer: entry?.override_text || answer?.short_answer || '',
      long_answer: isDemo ? '' : (answer?.long_answer_md?.replace(/[#*`]/g, '') ?? ''),
      override_text: entry?.override_text ?? '',
      evidence_ids: answer?.evidence_ids.join(', ') ?? '',
    };
  });
}

export function buildEvidenceIndexRows(
  questionnaire: Questionnaire,
  mapping: Mapping,
  answers: Answer[],
  evidence: Evidence[],
): EvidenceIndexRow[] {
  const answerMap = new Map(answers.map((a) => [a.id, a]));
  const evidenceMap = new Map(evidence.map((e) => [e.id, e]));

  const rows: EvidenceIndexRow[] = [];

  for (const q of questionnaire.questions) {
    const entry = mapping[q.qid];
    if (!entry?.answer_id) continue;

    const answer = answerMap.get(entry.answer_id);
    if (!answer) continue;

    for (const evId of answer.evidence_ids) {
      const ev = evidenceMap.get(evId);
      if (!ev) continue;

      rows.push({
        qid: q.qid,
        section: q.section,
        question: q.text,
        evidence_id: ev.id,
        evidence_title: ev.title,
        evidence_type: ev.type,
        evidence_url: ev.url_or_path,
        evidence_description: ev.description,
      });
    }
  }

  return rows;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportToCSV(rows: ExportRow[], isDemo: boolean): string {
  const data = isDemo
    ? rows.map((r) => ({ ...r, note: DEMO_LIMITS.WATERMARK }))
    : rows;
  return Papa.unparse(data, { header: true });
}

export function exportEvidenceIndexToCSV(rows: EvidenceIndexRow[]): string {
  return Papa.unparse(rows, { header: true });
}

export function exportEvidenceIndexToMarkdown(
  rows: EvidenceIndexRow[],
  slug: string,
  isDemo: boolean,
): string {
  const sections = Array.from(new Set(rows.map((r) => r.section)));
  const lines: string[] = [
    `# Evidence Index – ${slug}`,
    '',
    isDemo ? `> ${DEMO_LIMITS.WATERMARK}\n` : '',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    '',
  ];

  for (const section of sections) {
    lines.push(`## ${section}`, '');
    const sectionRows = rows.filter((r) => r.section === section);
    const byQ = new Map<string, EvidenceIndexRow[]>();
    for (const r of sectionRows) {
      const k = `${r.qid}: ${r.question}`;
      if (!byQ.has(k)) byQ.set(k, []);
      byQ.get(k)!.push(r);
    }

    for (const [question, evRows] of Array.from(byQ.entries())) {
      lines.push(`### ${question}`, '');
      for (const ev of evRows) {
        const link = ev.evidence_url.startsWith('http')
          ? `[${ev.evidence_title}](${ev.evidence_url})`
          : ev.evidence_title;
        lines.push(`- **${ev.evidence_type.toUpperCase()}** ${link} – ${ev.evidence_description}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ─── XLSX export (paid only) ──────────────────────────────────────────────────

export function exportToXLSX(
  rows: ExportRow[],
  evidenceRows: EvidenceIndexRow[],
  slug: string,
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Completed Questionnaire
  const ws1 = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Questionnaire');

  // Sheet 2: Evidence Index
  const ws2 = XLSX.utils.json_to_sheet(evidenceRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Evidence Index');

  // Sheet 3: Summary
  const summary = [
    { field: 'Questionnaire', value: slug },
    { field: 'Total Questions', value: rows.length },
    { field: 'Mapped Questions', value: rows.filter((r) => r.answer_id).length },
    { field: 'Evidence Items Referenced', value: new Set(evidenceRows.map((r) => r.evidence_id)).size },
    { field: 'Generated', value: new Date().toISOString() },
  ];
  const ws3 = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

// ─── Keyword-based answer matching (no LLM required) ─────────────────────────

export function rankAnswersForQuestion(
  questionText: string,
  answers: Answer[],
  topN = 3,
): Array<{ answer: Answer; score: number }> {
  const qWords = questionText.toLowerCase().split(/\W+/).filter((w) => w.length > 3);

  const scored = answers.map((a) => {
    const keywords = a.intent_keywords.map((k) => k.toLowerCase());
    const title = a.title.toLowerCase();
    const tags = a.tags.map((t) => t.toLowerCase());

    let score = 0;
    for (const word of qWords) {
      if (keywords.some((k) => k.includes(word) || word.includes(k))) score += 3;
      if (title.includes(word)) score += 2;
      if (tags.some((t) => t.includes(word))) score += 1;
    }
    return { answer: a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// ─── Staleness calculation ────────────────────────────────────────────────────

export function computeStaleness(
  answers: Answer[],
  evidence: Evidence[],
  answerThresholdDays = 180,
  evidenceThresholdDays = 365,
) {
  const now = Date.now();
  const DAY = 86400 * 1000;

  const staleAnswers = answers
    .map((a) => ({
      id: a.id,
      title: a.title,
      last_reviewed: a.last_reviewed,
      days_stale: Math.floor((now - new Date(a.last_reviewed).getTime()) / DAY) - answerThresholdDays,
    }))
    .filter((a) => a.days_stale > 0)
    .sort((a, b) => b.days_stale - a.days_stale);

  const staleEvidence = evidence
    .map((e) => ({
      id: e.id,
      title: e.title,
      last_updated: e.last_updated,
      days_stale: Math.floor((now - new Date(e.last_updated).getTime()) / DAY) - evidenceThresholdDays,
    }))
    .filter((e) => e.days_stale > 0)
    .sort((a, b) => b.days_stale - a.days_stale);

  return {
    stale_answers: staleAnswers,
    stale_evidence: staleEvidence,
    generated_at: new Date().toISOString(),
    answer_threshold_days: answerThresholdDays,
    evidence_threshold_days: evidenceThresholdDays,
  };
}
