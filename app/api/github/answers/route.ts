import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { validateAnswer } from '@/lib/schemas';
import { DEMO_ANSWERS, DEMO_LIMITS } from '@/lib/demo-data';
import type { Answer } from '@/lib/types';

// GET /api/github/answers → list all answers
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);

  if (license.demo) {
    return NextResponse.json({
      answers: DEMO_ANSWERS.slice(0, DEMO_LIMITS.MAX_ANSWERS),
      demo: true,
    });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const answers = await client.listAnswers();
  return NextResponse.json({ answers, demo: false });
}

// POST /api/github/answers → create answer via PR (paid only)
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

  const body = await request.json() as Answer;
  const validation = validateAnswer(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', issues: validation.error.issues }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);

  // Check if answer already exists (to determine create vs update)
  const existing = await client.getAnswer(body.id);

  const pr = await client.upsertAnswerViaPR(body, !existing);
  return NextResponse.json({ pr });
}
