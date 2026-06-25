import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHead, hashPassword, MODULES } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isHead())) return NextResponse.json({ error: "เฉพาะหัวหน้า" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (Array.isArray(body.perms)) data.perms = body.perms.filter((p: string) => MODULES.includes(p));
    if (typeof body.isHead === "boolean") data.isHead = body.isHead;
    if (body.password) data.passwordHash = hashPassword(body.password);
    if (typeof body.name === "string") data.name = body.name.trim() || null;
    const u = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ user: { id: u.id, username: u.username, perms: u.perms, isHead: u.isHead } });
  } catch (e) {
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isHead())) return NextResponse.json({ error: "เฉพาะหัวหน้า" }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
