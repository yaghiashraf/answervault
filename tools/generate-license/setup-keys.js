#!/usr/bin/env node
/**
 * AnswerVault – RSA Key Setup
 *
 * Generates a 2048-bit RSA keypair for the license system.
 *
 * Usage:
 *   node tools/generate-license/setup-keys.js
 *
 * Output:
 *   tools/generate-license/private.pem  (KEEP SECRET – never commit)
 *   tools/generate-license/public.pem   (safe to share / embed)
 *   prints ANSWERVAULT_PUBLIC_KEY value to copy into Vercel / .env.local
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const privPath = path.join(dir, 'private.pem');
const pubPath  = path.join(dir, 'public.pem');

console.log('\n🔐 AnswerVault – Generating RSA-2048 keypair...\n');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
fs.writeFileSync(pubPath,  publicKey);

console.log(`✅ Private key saved: ${privPath}`);
console.log(`   (NEVER commit this file – it is in .gitignore)\n`);
console.log(`✅ Public key saved:  ${pubPath}\n`);

// Format for Vercel env var (replace newlines with \\n)
const pubKeyEnv = publicKey.replace(/\n/g, '\\n');

console.log('─────────────────────────────────────────────────────────');
console.log('Copy this value to Vercel → Settings → Environment Variables');
console.log('  Key:   ANSWERVAULT_PUBLIC_KEY');
console.log('  Value:');
console.log();
console.log(pubKeyEnv);
console.log();
console.log('─────────────────────────────────────────────────────────');
console.log('\nNext step: Generate a license key with:');
console.log('  node tools/generate-license/index.js\n');
