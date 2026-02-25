import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('av_oauth_state')?.value;

  // CSRF check
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  // Parse redirect target from state
  let next = '/dashboard';
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (typeof parsed.next === 'string') next = parsed.next;
  } catch { /* ignore */ }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
  }

  // Fetch user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const user = await userRes.json() as { login: string; avatar_url?: string };

  // Create session
  const sessionToken = await createSessionToken({
    github_access_token: tokenData.access_token,
    github_username: user.login,
    github_avatar: user.avatar_url,
  });

  const response = NextResponse.redirect(new URL(next, request.url));

  response.cookies.set(SESSION_COOKIE.name, sessionToken, SESSION_COOKIE.options);
  // Clear OAuth state cookie
  response.cookies.delete('av_oauth_state');

  return response;
}
