import { NextRequest, NextResponse } from 'next/server';
import { getLicenseStatus } from '@/lib/license';
import { getSession } from '@/lib/session';

export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = getLicenseStatus(session.selected_repo);
  return NextResponse.json(status);
}
