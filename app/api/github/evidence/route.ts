import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { validateEvidence } from '@/lib/schemas';
import { DEMO_EVIDENCE, DEMO_LIMITS } from '@/lib/demo-data';
import type { Evidence } from '@/lib/types';

// GET /api/github/evidence
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);

  if (license.demo) {
    return NextResponse.json({
      evidence: DEMO_EVIDENCE.slice(0, DEMO_LIMITS.MAX_EVIDENCE),
      demo: true,
    });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const evidence = await client.listEvidence();
  return NextResponse.json({ evidence, demo: false });
}

// POST /api/github/evidence → upsert via PR (paid only)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);
  if (license.demo) {
    return NextResponse.json({ error: 'Write operations require a valid license' }, { status: 403 });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const body = await request.json() as Evidence;
  const validation = validateEvidence(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', issues: validation.error.issues }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const existing = await client.listEvidence();
  const pr = await client.upsertEvidenceViaPR(existing, body);
  return NextResponse.json({ pr });
}
