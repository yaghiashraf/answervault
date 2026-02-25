import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { DEMO_QUESTIONNAIRE } from '@/lib/demo-data';

// GET /api/github/questionnaires → list all questionnaires
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);

  if (license.demo) {
    return NextResponse.json({ questionnaires: [DEMO_QUESTIONNAIRE], demo: true });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const questionnaires = await client.listQuestionnaires();
  return NextResponse.json({ questionnaires, demo: false });
}
