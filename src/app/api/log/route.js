import { NextResponse } from 'next/server';
import { getLog } from '@/lib/pointsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const log = await getLog(30);
    return NextResponse.json({ log });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
