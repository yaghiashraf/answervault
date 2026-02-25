import crypto from 'crypto';
import type { LicensePayload, LicenseResult, LicenseStatus } from './types';

/**
 * License verification is fully offline (no network calls).
 * Token format: base64url(JSON payload) + "." + base64url(RSA-SHA256 signature)
 *
 * The PUBLIC key is read from ANSWERVAULT_PUBLIC_KEY env var.
 * The PRIVATE key is never embedded – only used in tools/generate-license/.
 */

function getPublicKey(): string | null {
  const key = process.env.ANSWERVAULT_PUBLIC_KEY;
  if (!key || key.trim() === '') return null;
  // Handle \n literal from Vercel env vars
  return key.replace(/\\n/g, '\n');
}

export function verifyLicense(licenseKey: string, currentRepo?: string): LicenseResult {
  const publicKey = getPublicKey();

  if (!publicKey) {
    return { valid: false, error: 'No public key configured – running in demo mode' };
  }

  if (!licenseKey || licenseKey.trim() === '') {
    return { valid: false, error: 'No license key provided' };
  }

  try {
    const parts = licenseKey.trim().split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid license format (expected payload.signature)' };
    }

    const [payloadB64, signatureB64] = parts;

    // Decode payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: LicensePayload = JSON.parse(payloadJson);

    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(payloadB64);
    const signature = Buffer.from(signatureB64, 'base64url');

    let isValid: boolean;
    try {
      isValid = verify.verify(publicKey, signature);
    } catch {
      return { valid: false, error: 'Signature verification failed – check your public key format' };
    }

    if (!isValid) {
      return { valid: false, error: 'Invalid license signature' };
    }

    // Check expiry
    if (payload.expiry && payload.expiry < Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        error: `License expired on ${new Date(payload.expiry * 1000).toISOString().split('T')[0]}`,
      };
    }

    // Check repo restriction
    if (
      currentRepo &&
      payload.allowed_repo !== '*' &&
      payload.allowed_repo !== currentRepo
    ) {
      return {
        valid: false,
        error: `License is for repo "${payload.allowed_repo}", not "${currentRepo}"`,
      };
    }

    return { valid: true, payload };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to parse license: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Returns the current license status for use in the UI and API routes */
export function getLicenseStatus(currentRepo?: string): LicenseStatus {
  const key = process.env.LICENSE_KEY;

  if (!key || key.trim() === '') {
    return { demo: true, error: 'No LICENSE_KEY set' };
  }

  const result = verifyLicense(key, currentRepo);

  if (!result.valid) {
    return { demo: true, error: result.error };
  }

  return {
    demo: false,
    customer_name: result.payload!.customer_name,
    allowed_repo: result.payload!.allowed_repo,
    expiry: result.payload!.expiry,
  };
}

export function isDemo(currentRepo?: string): boolean {
  return getLicenseStatus(currentRepo).demo;
}
