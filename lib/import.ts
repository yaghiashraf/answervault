/**
 * Questionnaire Import
 * Supports: CSV (via papaparse), XLSX (via xlsx)
 * Normalises any tabular format into our internal Questionnaire schema.
 *
 * Expected column names (case-insensitive, flexible aliases supported):
 *   qid / question_id / id / #
 *   text / question / question_text / description
 *   section / category / domain / control_area
 *   answer_type / type (default: text)
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Question, Questionnaire, RawImportRow } from './types';

// ─── Column name aliases ───────────────────────────────────────────────────────

const QID_COLS   = ['qid', 'question_id', 'id', '#', 'no', 'number'];
const TEXT_COLS  = ['text', 'question', 'question_text', 'description', 'requirement'];
const SEC_COLS   = ['section', 'category', 'domain', 'control_area', 'area', 'topic'];
const TYPE_COLS  = ['answer_type', 'type', 'response_type', 'format'];

function findCol(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx >= 0) return headers[idx];
  }
  // Partial match
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h.includes(alias));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function normaliseType(raw: string | undefined): Question['answer_type'] {
  if (!raw) return 'text';
  const r = raw.toLowerCase().trim();
  if (r.includes('yes') && r.includes('no') && r.includes('na')) return 'yes_no_na';
  if (r.includes('yes') && r.includes('no')) return 'yes_no';
  if (r.includes('select') || r.includes('choice')) return 'select';
  return 'text';
}

function rowsToQuestions(rows: RawImportRow[], maxQuestions?: number): Question[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);

  const qidCol  = findCol(headers, QID_COLS);
  const textCol = findCol(headers, TEXT_COLS);
  const secCol  = findCol(headers, SEC_COLS);
  const typeCol = findCol(headers, TYPE_COLS);

  const questions: Question[] = [];
  let autoIdx = 1;

  for (const row of rows) {
    // Skip completely empty rows
    const values = Object.values(row).map((v) => String(v ?? '').trim());
    if (values.every((v) => v === '')) continue;

    const text = textCol ? String(row[textCol] ?? '').trim() : '';
    if (!text) continue; // skip rows without question text

    const qid = qidCol
      ? String(row[qidCol] ?? '').trim() || `Q${String(autoIdx).padStart(3, '0')}`
      : `Q${String(autoIdx).padStart(3, '0')}`;

    questions.push({
      qid,
      text,
      section: secCol ? String(row[secCol] ?? '').trim() || 'General' : 'General',
      answer_type: normaliseType(typeCol ? String(row[typeCol] ?? '') : undefined),
    });

    autoIdx++;
    if (maxQuestions && questions.length >= maxQuestions) break;
  }

  return questions;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ─── CSV import ───────────────────────────────────────────────────────────────

export function importFromCSV(
  csvText: string,
  filename: string,
  maxQuestions?: number,
): Questionnaire {
  const result = Papa.parse<RawImportRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const questions = rowsToQuestions(result.data, maxQuestions);

  return {
    slug: slugify(filename.replace(/\.[^.]+$/, '')),
    source_filename: filename,
    imported_at: new Date().toISOString(),
    questions,
  };
}

// ─── XLSX import ──────────────────────────────────────────────────────────────

export function importFromXLSX(
  buffer: ArrayBuffer,
  filename: string,
  maxQuestions?: number,
): Questionnaire {
  const workbook = XLSX.read(buffer, { type: 'array' });
  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawImportRow>(sheet, { defval: '' });

  const questions = rowsToQuestions(rows, maxQuestions);

  return {
    slug: slugify(filename.replace(/\.[^.]+$/, '')),
    source_filename: filename,
    imported_at: new Date().toISOString(),
    questions,
  };
}

// ─── Auto-detect and import ───────────────────────────────────────────────────

export async function importQuestionnaire(
  file: File,
  maxQuestions?: number,
): Promise<Questionnaire> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv')) {
    const text = await file.text();
    return importFromCSV(text, file.name, maxQuestions);
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    return importFromXLSX(buffer, file.name, maxQuestions);
  }

  throw new Error(`Unsupported file type: ${file.name}. Use .csv or .xlsx`);
}
