#!/usr/bin/env node
/**
 * AnswerVault – License Generator
 *
 * Mints a signed LICENSE_KEY for a customer.
 *
 * Prerequisites:
 *   Run `node tools/generate-license/setup-keys.js` first to generate your keypair.
 *
 * Usage:
 *   node tools/generate-license/index.js \
 *     --customer "Acme Corp" \
 *     --repo "acmecorp/answervault" \
 *     [--expiry "2027-01-01"]
 *
 * Options:
 *   --customer   Customer name (required)
 *   --repo       GitHub repo in owner/name format (required). Use * to allow any repo.
 *   --expiry     Optional expiry date in YYYY-MM-DD format (default: no expiry)
 *   --key        Path to private PEM file (default: tools/generate-license/private.pem)
 *
 * Output:
 *   Prints the LICENSE_KEY string to stdout. Send it to your customer.
 *   They set it as LICENSE_KEY in their Vercel environment variables.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── Parse CLI args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : null;
}

const customerName = getArg('customer');
const allowedRepo  = getArg('repo');
const expiryStr    = getArg('expiry');
const keyPath      = getArg('key') ?? path.join(__dirname, 'private.pem');

if (!customerName || !allowedRepo) {
  console.error('Usage: node index.js --customer "Name" --repo "owner/repo" [--expiry YYYY-MM-DD]');
  process.exit(1);
}

// ── Load private key ──────────────────────────────────────────────────────────

if (!fs.existsSync(keyPath)) {
  console.error(`\n❌ Private key not found at: ${keyPath}`);
  console.error('   Run `node tools/generate-license/setup-keys.js` first.\n');
  process.exit(1);
}

const privateKey = fs.readFileSync(keyPath, 'utf8');

// ── Build payload ─────────────────────────────────────────────────────────────

const payload = {
  customer_name: customerName,
  allowed_repo:  allowedRepo,
  issued_at:     Math.floor(Date.now() / 1000),
};

if (expiryStr) {
  const expiry = new Date(expiryStr);
  if (isNaN(expiry.getTime())) {
    console.error(`\n❌ Invalid expiry date: ${expiryStr} (expected YYYY-MM-DD)\n`);
    process.exit(1);
  }
  payload.expiry = Math.floor(expiry.getTime() / 1000);
}

// ── Sign ──────────────────────────────────────────────────────────────────────

const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const sign = crypto.createSign('RSA-SHA256');
sign.update(payloadB64);
const signatureB64 = sign.sign(privateKey, 'base64url');

const licenseKey = `${payloadB64}.${signatureB64}`;

// ── Output ────────────────────────────────────────────────────────────────────

console.log('\n✅ License generated!\n');
console.log('Customer:    ', customerName);
console.log('Allowed Repo:', allowedRepo);
console.log('Issued At:   ', new Date(payload.issued_at * 1000).toISOString());
if (payload.expiry) {
  console.log('Expires:     ', new Date(payload.expiry * 1000).toISOString().split('T')[0]);
} else {
  console.log('Expires:      Never (lifetime license)');
}
console.log('\n─────────────────────────────────────────────────────────');
console.log('LICENSE_KEY (send to customer → set as Vercel env var):');
console.log('─────────────────────────────────────────────────────────\n');
console.log(licenseKey);
console.log('\n─────────────────────────────────────────────────────────\n');
