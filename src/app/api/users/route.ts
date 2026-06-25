import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHead, hashPassword, MODULES } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isHead())) return NextResponse.json({ error: "เฉพาะหัวหน้า" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({
    users: users.map((u) => ({ id: u.id, username: u.username, name: u.name, isHead: u.isHead, perms: u.perms })),
    modules: MODULES,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isHead())) return NextResponse.json({ error: "เฉพาะหัวหน้า" }, { status: 403 });
  try {
    const { username, password, name, perms, isHead: head } = await req.json();
    if (!username?.trim() || !password) return NextResponse.json({ error: "กรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    const cleanPerms = Array.isArray(perms) ? perms.filter((p: string) => MODULES.includes(p)) : [];
    const u = await prisma.user.create({
      data: { username: username.trim(), passwordHash: hashPassword(password), name: name?.trim() || null, isHead: !!head, perms: cleanPerms },
    });
    return NextResponse.json({ user: { id: u.id, username: u.username } }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีแล้ว" }, { status: 409 });
    return NextResponse.json({ error: "สร้างผู้ใช้ไม่สำเร็จ" }, { status: 500 });
  }
}
