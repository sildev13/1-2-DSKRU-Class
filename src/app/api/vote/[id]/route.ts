import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await canEdit('vote'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { id } = await params;
    const { closed } = await req.json();
    const poll = await prisma.poll.update({ where: { id }, data: { closed: !!closed } });
    return NextResponse.json({ poll });
  } catch (e) {
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await canEdit('vote'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.poll.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
