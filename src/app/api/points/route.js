import { NextResponse } from 'next/server';
import { adjustPoints } from '@/lib/pointsStore';
import { canEdit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!(await canEdit('points'))) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบหัวหน้าก่อน' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    const change = Number(body.change);
    const reason = (body.reason || '').trim();
    if (!id || !Number.isFinite(change) || change === 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    const member = await adjustPoints(id, change, reason);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
