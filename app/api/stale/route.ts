import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { computeStaleness } from '@/lib/export';
import { DEMO_ANSWERS, DEMO_EVIDENCE } from '@/lib/demo-data';

export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);
  const answerDays = Number(process.env.STALE_ANSWER_DAYS ?? 180);
  const evidenceDays = Number(process.env.STALE_EVIDENCE_DAYS ?? 365);

  if (license.demo) {
    const report = computeStaleness(DEMO_ANSWERS, DEMO_EVIDENCE, answerDays, evidenceDays);
    return NextResponse.json({ ...report, demo: true });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const [answers, evidence] = await Promise.all([
    client.listAnswers(),
    client.listEvidence(),
  ]);

  const report = computeStaleness(answers, evidence, answerDays, evidenceDays);
  return NextResponse.json({ ...report, demo: false });
}
