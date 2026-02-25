#!/usr/bin/env node
/**
 * Schema validation script – runs on pull requests that modify data files.
 * Exits with code 1 if any validation errors are found (fails the PR check).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
const ajv = new Ajv({ allErrors: true, strict: false });

let errors = 0;

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(root, 'schemas', `${name}.schema.json`), 'utf8'));
}

function validate(schemaName, data, label) {
  const validate = ajv.compile(loadSchema(schemaName));
  if (!validate(data)) {
    console.error(`\n❌ Schema error in ${label}:`);
    for (const err of validate.errors ?? []) {
      console.error(`   ${err.instancePath || '/'} ${err.message}`);
    }
    errors++;
    return false;
  }
  return true;
}

// ── Validate answers ──────────────────────────────────────────────────────────
const answerDir = path.join(root, 'answers');
if (fs.existsSync(answerDir)) {
  const files = fs.readdirSync(answerDir).filter((f) => f.endsWith('.yml'));
  for (const file of files) {
    const data = yaml.load(fs.readFileSync(path.join(answerDir, file), 'utf8'));
    if (validate('answer', data, `answers/${file}`)) {
      console.log(`✓ answers/${file}`);
    }
  }
}

// ── Validate evidence ─────────────────────────────────────────────────────────
const evidencePath = path.join(root, 'evidence', 'evidence.yml');
if (fs.existsSync(evidencePath)) {
  const items = yaml.load(fs.readFileSync(evidencePath, 'utf8')) ?? [];
  for (const item of items) {
    if (validate('evidence', item, `evidence/evidence.yml (id: ${item.id})`)) {
      console.log(`✓ evidence/${item.id}`);
    }
  }
}

// ── Validate questionnaires + mappings ────────────────────────────────────────
const qDir = path.join(root, 'questionnaires');
if (fs.existsSync(qDir)) {
  for (const slug of fs.readdirSync(qDir)) {
    const qPath = path.join(qDir, slug, 'questionnaire.json');
    if (fs.existsSync(qPath)) {
      const q = JSON.parse(fs.readFileSync(qPath, 'utf8'));
      if (validate('questionnaire', q, `questionnaires/${slug}/questionnaire.json`)) {
        console.log(`✓ questionnaires/${slug}/questionnaire.json`);
      }
    }
    const mPath = path.join(qDir, slug, 'mapping.yml');
    if (fs.existsSync(mPath)) {
      const m = yaml.load(fs.readFileSync(mPath, 'utf8')) ?? {};
      if (validate('mapping', m, `questionnaires/${slug}/mapping.yml`)) {
        console.log(`✓ questionnaires/${slug}/mapping.yml`);
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (errors > 0) {
  console.error(`\n❌ ${errors} validation error(s) found. Please fix before merging.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ All schemas valid!\n`);
}
