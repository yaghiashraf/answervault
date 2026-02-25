import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
  }

  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const state = Buffer.from(JSON.stringify({ next, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo read:user user:email',
    state,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );

  // Store state in a short-lived cookie for CSRF protection
  response.cookies.set('av_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
