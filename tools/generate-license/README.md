# License Generation Tools

These scripts manage the AnswerVault license system.

## One-time setup (run once when you fork the template)

```bash
node tools/generate-license/setup-keys.js
```

This generates:
- `tools/generate-license/private.pem` — **NEVER commit. Keep locally.**
- `tools/generate-license/public.pem` — Can be shared; embed in your deployment.

Then add `ANSWERVAULT_PUBLIC_KEY` to Vercel (the script prints the value).

---

## Generating a license for a customer

```bash
node tools/generate-license/index.js \
  --customer "Acme Corp" \
  --repo "acmecorp/answervault"
```

With expiry:
```bash
node tools/generate-license/index.js \
  --customer "Acme Corp" \
  --repo "acmecorp/answervault" \
  --expiry "2027-01-01"
```

Wildcard (any repo — e.g., for resellers or consultants):
```bash
node tools/generate-license/index.js \
  --customer "Consulting Partner" \
  --repo "*"
```

The script outputs a `LICENSE_KEY` string. Send it to your customer; they set it as:
- Vercel → Settings → Environment Variables → `LICENSE_KEY`

---

## How it works

The license token is `base64url(JSON payload) + "." + base64url(RSA-SHA256 signature)`.

Verification is **offline** — no network calls, no license server. The public key embedded in
your Vercel deployment verifies the signature. As long as your private key is kept secret,
nobody can generate valid licenses without it.

---

## Security checklist

- [ ] `private.pem` is in `.gitignore` and never pushed to GitHub
- [ ] `ANSWERVAULT_PUBLIC_KEY` is set in Vercel (not in `.env.example` which is public)
- [ ] Private key is backed up securely (password manager or secrets vault)
- [ ] Use customer-specific `--repo` values to prevent license sharing
