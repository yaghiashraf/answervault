import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

/**
 * Creates a demo session without GitHub OAuth.
 * The resulting session has no access token, so license checks return demo mode
 * and all API routes serve DEMO_* data from lib/demo-data.ts.
 */
export async function GET(request: NextRequest) {
  const sessionToken = await createSessionToken({
    github_access_token: '',
    github_username: 'demo',
    github_avatar: '',
  });

  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(SESSION_COOKIE.name, sessionToken, SESSION_COOKIE.options);
  return response;
}
