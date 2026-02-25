import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { validateQuestionnaire } from '@/lib/schemas';
import { DEMO_QUESTIONNAIRE, DEMO_LIMITS } from '@/lib/demo-data';
import type { Questionnaire } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);

  if (license.demo) {
    if (slug !== DEMO_QUESTIONNAIRE.slug) {
      return NextResponse.json({ error: 'Not found in demo' }, { status: 404 });
    }
    return NextResponse.json({ questionnaire: DEMO_QUESTIONNAIRE });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const questionnaire = await client.getQuestionnaire(slug);
  if (!questionnaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ questionnaire });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  await context.params; // consume params
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);
  const body = await request.json() as Questionnaire;

  if (license.demo) {
    if (body.questions.length > DEMO_LIMITS.MAX_QUESTIONS) {
      return NextResponse.json({
        error: `Demo mode: max ${DEMO_LIMITS.MAX_QUESTIONS} questions allowed`,
      }, { status: 400 });
    }
    const validation = validateQuestionnaire(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', issues: validation.error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: true, demo: true, message: 'Demo: not persisted to GitHub' });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const validation = validateQuestionnaire(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', issues: validation.error.issues }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const pr = await client.saveQuestionnaireViaPR(body);
  return NextResponse.json({ pr });
}
