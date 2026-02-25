# AnswerVault

> **Respond to vendor security questionnaires in hours, not weeks.**
>
> Maintain a versioned Answer Library + Evidence Catalog in your GitHub repo.
> Map any SIG / CAIQ / custom questionnaire to your canonical answers.
> Export completed responses and evidence indexes with one click.

---

## What is it?

AnswerVault is a **self-hosted, one-time-license** web app for startups and SMBs that regularly
receive vendor security questionnaires (VSQs). Instead of copy-pasting from spreadsheets or
reinventing answers each time, you:

1. **Build** a library of canonical answers (encryption, MFA, incident response, etc.)
2. **Catalogue** supporting evidence (SOC 2 report, pen-test summary, policies)
3. **Import** any questionnaire (CSV or XLSX) and map questions to your answers in a grid UI
4. **Export** a completed questionnaire + evidence index (CSV or XLSX)
5. **Track freshness** – get notified when answers or evidence go stale

Everything is stored as YAML/JSON files in *your own GitHub repo*. Edits create PRs. You stay in control.

---

## Pricing

| | Demo | Paid |
|---|---|---|
| **Price** | Free | **$499 one-time** |
| **GitHub writes** | ✗ (read-only) | ✓ PR-based |
| **Export formats** | CSV + watermark | CSV + XLSX |
| **Questionnaires** | 1 import · 30 questions | Unlimited |
| **Answers** | 20 (pre-loaded) | Unlimited |
| **GitHub Actions** | ✗ | ✓ |
| **License** | None | Lifetime |

Demo mode is always on when `LICENSE_KEY` is absent. No account required to try it.

---

## Quick Start (Deploy in 10 minutes)

### 1. Fork and clone

```bash
# Use this repo as a GitHub template
# https://github.com/your-org/answervault → "Use this template"

git clone https://github.com/YOUR_ORG/answervault
cd answervault
npm install
```

### 2. Create a GitHub OAuth App

Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**

| Field | Value |
|-------|-------|
| Application name | AnswerVault |
| Homepage URL | `https://your-app.vercel.app` |
| Authorization callback URL | `https://your-app.vercel.app/api/auth/callback` |

Copy the **Client ID** and **Client Secret**.

### 3. Generate session secret

```bash
openssl rand -base64 32
```

### 4. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/answervault)

Set these environment variables in **Vercel → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `NEXTAUTH_SECRET` | Random 32-char string (from openssl above) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `ANSWERVAULT_PUBLIC_KEY` | RSA public key (see Paid Mode setup below) |
| `LICENSE_KEY` | Your license token (see Paid Mode setup below) |

> **Demo mode**: If you skip `ANSWERVAULT_PUBLIC_KEY` and `LICENSE_KEY`, the app starts in
> Demo mode with the pre-loaded CloudWidget Inc. dataset. This is great for evaluation.

### 5. Local development

```bash
cp .env.example .env.local
# Fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXTAUTH_SECRET
# NEXTAUTH_URL=http://localhost:3000

npm run dev
# Open http://localhost:3000
```

---

## Paid Mode Setup (After Purchase)

### 1. Generate your RSA keypair

```bash
node tools/generate-license/setup-keys.js
```

This creates:
- `tools/generate-license/private.pem` → **NEVER commit. Store securely.**
- `tools/generate-license/public.pem` → paste into `ANSWERVAULT_PUBLIC_KEY`

### 2. Add public key to Vercel

The script prints the `ANSWERVAULT_PUBLIC_KEY` value. Copy it into Vercel environment variables.

### 3. Generate your license key

```bash
node tools/generate-license/index.js \
  --customer "Your Company Name" \
  --repo "your-github-username/answervault"
```

Copy the printed `LICENSE_KEY` value into Vercel environment variables.

### 4. Redeploy

Vercel will redeploy automatically when env vars change. Paid mode is now active.

---

## Repository Structure

```
answervault/
├── app/                         # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/                # GitHub OAuth (login/callback/logout)
│   │   ├── github/              # GitHub-backed data endpoints
│   │   ├── export/              # CSV + XLSX export
│   │   ├── stale/               # Staleness report
│   │   └── suggest/             # Keyword-based answer suggestions
│   ├── dashboard/               # Dashboard (stale widgets, stats)
│   ├── answers/                 # Answer Library (list + edit)
│   ├── evidence/                # Evidence Catalog (list + edit)
│   ├── questionnaires/          # Questionnaire list + import
│   │   └── [slug]/              # Mapping grid + export
│   ├── settings/                # Repo connection, license, thresholds
│   └── login/                   # GitHub OAuth sign-in page
│
├── lib/                         # Core library
│   ├── types.ts                 # TypeScript types
│   ├── session.ts               # JWT session management
│   ├── license.ts               # Offline license verification
│   ├── github.ts                # GitHub API client (Octokit)
│   ├── schemas.ts               # Zod validators
│   ├── import.ts                # CSV + XLSX questionnaire import
│   ├── export.ts                # CSV + XLSX export + staleness
│   └── demo-data.ts             # Static demo dataset
│
├── answers/                     # YOUR Answer Library (YAML + MD)
│   ├── ans-001.yml
│   ├── ans-001.md
│   └── ...
│
├── evidence/
│   └── evidence.yml             # YOUR Evidence Catalog
│
├── questionnaires/
│   └── {slug}/
│       ├── questionnaire.json   # Imported questionnaire
│       └── mapping.yml          # QID → answer_id mappings
│
├── demo-data/                   # Pre-loaded demo dataset (read-only)
│
├── schemas/                     # JSON Schemas for data validation
│
├── tools/
│   └── generate-license/        # RSA keypair + license minting scripts
│
├── .github/workflows/
│   ├── export.yml               # Manual export → artifacts
│   ├── validate.yml             # PR schema validation
│   └── stale-check.yml          # Weekly staleness → GitHub Issues
│
└── tests/                       # Vitest unit tests
```

---

## Data Formats

### Answer (`answers/{id}.yml` + `answers/{id}.md`)

```yaml
id: ans-001
title: Encryption at Rest
intent_keywords: [encryption, AES, at rest, data protection]
short_answer: All customer data is encrypted at rest using AES-256-GCM.
tags: [encryption, data-protection]
frameworks: [SOC2, ISO27001, CAIQ]
owner: security@company.com
last_reviewed: "2025-01-15"
evidence_ids: [ev-001, ev-002]
```

The long-form markdown answer lives in `answers/{id}.md`.

### Evidence (`evidence/evidence.yml`)

```yaml
- id: ev-001
  title: SOC 2 Type II Report (2024)
  type: doc          # doc | link | file
  url_or_path: https://trust.company.com/soc2
  description: Annual SOC 2 Type II audit report...
  last_updated: "2025-01-15"
  tags: [SOC2, audit]
```

### Mapping (`questionnaires/{slug}/mapping.yml`)

```yaml
A.1:
  answer_id: ans-004
B.1:
  answer_id: ans-001
  override_text: "Custom answer that replaces short_answer in exports."
C.1:
  answer_id: null   # unmapped
```

---

## Workflows

### Importing a questionnaire

1. Go to **Questionnaires** → **Import CSV / XLSX**
2. Upload a file with columns: `qid`, `text`, `section`, `answer_type`
   (column names are flexible; see `lib/import.ts` for aliases)
3. In **paid mode**: a PR is opened with the questionnaire JSON
4. In **demo mode**: parsed in-memory (not persisted)

### Mapping questions to answers

1. Open a questionnaire from the list
2. For each row, select an answer from the dropdown (or click **✨ Suggest** for keyword-based suggestions)
3. Optionally type an **Override Text** to customise the answer for this specific questionnaire
4. Click **Save Mapping via PR** (paid) or **Validate Mapping** (demo)

### Exporting

From the questionnaire mapping page:
- **↓ CSV** – Completed questionnaire CSV (demo includes watermark)
- **↓ XLSX** – Full workbook with Questionnaire + Evidence Index + Summary sheets *(paid only)*
- **↓ Evidence CSV** – Evidence Index as CSV
- **↓ Evidence MD** – Evidence Index as Markdown

### Staleness tracking

Dashboard shows stale items automatically. Configure thresholds:
```
STALE_ANSWER_DAYS=180   # default
STALE_EVIDENCE_DAYS=365 # default
```

---

## GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `export.yml` | Manual (`workflow_dispatch`) | Generates CSV/XLSX exports, saves as artifacts |
| `validate.yml` | Pull request | Validates all YAML/JSON against schemas; fails PR if invalid |
| `stale-check.yml` | Weekly (Monday 09:00 UTC) | Opens/updates a GitHub Issue listing stale items |

---

## Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run typecheck  # TypeScript type check
npm run lint       # ESLint
```

---

## FAQ

**Can I use this without a GitHub account?**
No — GitHub is the backend. You need a GitHub account and a forked repo.

**What GitHub permissions does the app need?**
OAuth scopes: `repo` (read/write to your repo), `read:user`. The app never touches repos you don't explicitly select.

**Does this send my data anywhere?**
No. All data stays in your GitHub repo. The Vercel deployment is stateless (no database).

**Can I use a private repo?**
Yes. The `repo` OAuth scope covers private repos.

**What if GitHub is down?**
Demo mode works fully offline (static data). In paid mode, reads are cached for 5 minutes.

**Can I extend the Answer Library with LLM suggestions?**
Set `OPENAI_API_KEY` as an env var. The `/api/suggest` endpoint will use embeddings for
better matching. Without it, keyword-based matching is used (works well for most cases).

**Can I run it without Vercel?**
Yes — it's a standard Next.js app. Deploy to any Node.js host: Railway, Render, Fly.io, etc.

---

## License

**AnswerVault** is a commercial product sold under a one-time license.

- **Demo mode**: Free to use with the pre-loaded dataset.
- **Paid license ($499)**: One-time purchase. Self-host forever. No subscription.
- **Source available**: Fork the template, customise to your needs.

Copyright © 2025 AnswerVault. All rights reserved.
