#!/usr/bin/env node
/**
 * GitHub Actions export script
 * Reads answers, evidence, questionnaire + mapping from repo files
 * Generates CSV and/or XLSX exports into /exports/{slug}/
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Papa = require('papaparse');
const XLSX = require('xlsx');

const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
const slug = process.argv[2] || process.env.SLUG;
const format = (process.argv[3] || process.env.FORMAT || 'csv').toLowerCase();

if (!slug) { console.error('Usage: node export.js <slug> [csv|xlsx]'); process.exit(1); }

// ── Load data ─────────────────────────────────────────────────────────────────

function loadAnswers() {
  const dir = path.join(root, 'answers');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => {
      const meta = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'));
      const mdPath = path.join(dir, f.replace('.yml', '.md'));
      if (fs.existsSync(mdPath)) meta.long_answer_md = fs.readFileSync(mdPath, 'utf8');
      return meta;
    });
}

function loadEvidence() {
  const p = path.join(root, 'evidence', 'evidence.yml');
  if (!fs.existsSync(p)) return [];
  return yaml.load(fs.readFileSync(p, 'utf8')) ?? [];
}

function loadQuestionnaire(s) {
  const p = path.join(root, 'questionnaires', s, 'questionnaire.json');
  if (!fs.existsSync(p)) { console.error(`Questionnaire not found: ${p}`); process.exit(1); }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadMapping(s) {
  const p = path.join(root, 'questionnaires', s, 'mapping.yml');
  if (!fs.existsSync(p)) return {};
  return yaml.load(fs.readFileSync(p, 'utf8')) ?? {};
}

// ── Build rows ────────────────────────────────────────────────────────────────

function buildRows(questionnaire, mapping, answers) {
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
      long_answer: answer?.long_answer_md?.replace(/[#*`]/g, '') ?? '',
      override_text: entry?.override_text ?? '',
      evidence_ids: answer?.evidence_ids?.join(', ') ?? '',
    };
  });
}

function buildEvidenceRows(questionnaire, mapping, answers, evidence) {
  const answerMap = new Map(answers.map((a) => [a.id, a]));
  const evidenceMap = new Map(evidence.map((e) => [e.id, e]));
  const rows = [];
  for (const q of questionnaire.questions) {
    const entry = mapping[q.qid];
    if (!entry?.answer_id) continue;
    const answer = answerMap.get(entry.answer_id);
    if (!answer) continue;
    for (const evId of answer.evidence_ids ?? []) {
      const ev = evidenceMap.get(evId);
      if (!ev) continue;
      rows.push({ qid: q.qid, section: q.section, question: q.text, evidence_id: ev.id, evidence_title: ev.title, evidence_type: ev.type, evidence_url: ev.url_or_path, evidence_description: ev.description });
    }
  }
  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const answers = loadAnswers();
const evidence = loadEvidence();
const questionnaire = loadQuestionnaire(slug);
const mapping = loadMapping(slug);

const rows = buildRows(questionnaire, mapping, answers);
const evidenceRows = buildEvidenceRows(questionnaire, mapping, answers, evidence);
const outDir = path.join(root, 'exports', slug);
fs.mkdirSync(outDir, { recursive: true });

const date = new Date().toISOString().split('T')[0];

if (format === 'xlsx') {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Questionnaire');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evidenceRows), 'Evidence Index');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { field: 'Questionnaire', value: slug },
    { field: 'Total Questions', value: rows.length },
    { field: 'Mapped', value: rows.filter((r) => r.answer_id).length },
    { field: 'Generated', value: new Date().toISOString() },
  ]), 'Summary');
  const outPath = path.join(outDir, `${slug}-${date}.xlsx`);
  XLSX.writeFile(wb, outPath);
  console.log(`✅ XLSX export: ${outPath}`);
} else {
  const csvPath = path.join(outDir, `${slug}-${date}.csv`);
  const evCsvPath = path.join(outDir, `${slug}-${date}-evidence-index.csv`);
  fs.writeFileSync(csvPath, Papa.unparse(rows));
  fs.writeFileSync(evCsvPath, Papa.unparse(evidenceRows));
  console.log(`✅ CSV exports: ${csvPath}, ${evCsvPath}`);
}

console.log(`\nExport complete: ${rows.length} questions, ${evidenceRows.length} evidence references.`);
