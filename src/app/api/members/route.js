import { NextResponse } from 'next/server';
import { getMembers, addMember, deleteMember } from '@/lib/pointsStore';
import { canEdit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({
      members: members.map(({ id, name, points }) => ({ id, name, points })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await canEdit('points'))) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบหัวหน้าก่อน' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const startPoints = Number.isFinite(Number(body.startPoints))
      ? Number(body.startPoints)
      : Number(process.env.STARTING_POINTS || 100);
    if (!name) return NextResponse.json({ error: 'กรุณาใส่ชื่อสมาชิก' }, { status: 400 });
    const member = await addMember(name, startPoints);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await canEdit('points'))) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบหัวหน้าก่อน' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ไม่พบ id' }, { status: 400 });
    await deleteMember(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
