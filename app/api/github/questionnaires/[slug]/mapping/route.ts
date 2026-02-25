import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { validateMapping } from '@/lib/schemas';
import { DEMO_MAPPING } from '@/lib/demo-data';
import type { Mapping } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);

  if (license.demo) {
    return NextResponse.json({ mapping: DEMO_MAPPING, demo: true });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const mapping = await client.getMapping(slug);
  return NextResponse.json({ mapping, demo: false });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const license = getLicenseStatus(session.selected_repo);
  const body = await request.json() as Mapping;

  const validation = validateMapping(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', issues: validation.error.issues }, { status: 400 });
  }

  if (license.demo) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: 'Demo: mapping validated but not saved to GitHub. Upgrade to persist.',
    });
  }

  if (!session.selected_repo) {
    return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
  }

  const client = new GitHubClient(session.github_access_token, session.selected_repo);
  const pr = await client.saveMappingViaPR(slug, body);
  return NextResponse.json({ pr });
}
