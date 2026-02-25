import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

// GET /api/github/repos → list user's repos
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // For listing repos, the repo arg doesn't matter – we just need the token
  const client = new GitHubClient(session.github_access_token, `${session.github_username}/placeholder`);
  const repos = await client.listUserRepos();
  return NextResponse.json({ repos });
}

// POST /api/github/repos → set selected repo in session
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { repo: string };
  if (!body.repo || !body.repo.includes('/')) {
    return NextResponse.json({ error: 'Invalid repo format (expected owner/name)' }, { status: 400 });
  }

  const newToken = await createSessionToken({ ...session, selected_repo: body.repo });
  const response = NextResponse.json({ ok: true, selected_repo: body.repo });
  response.cookies.set(SESSION_COOKIE.name, newToken, SESSION_COOKIE.options);
  return response;
}
