import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCard } from "@/lib/line";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await canEdit('board'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { title, body, pinned } = await req.json();
    if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "ใส่หัวข้อและเนื้อหา" }, { status: 400 });
    const item = await prisma.announcement.create({
      data: { title: title.trim(), body: body.trim(), pinned: !!pinned },
    });
    await notifyCard({ accent: "#F59E0B", icon: "📢", title: "ประกาศใหม่", rows: [item.title, item.body], path: "/board", urlLabel: "อ่านประกาศ" });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "โพสต์ไม่สำเร็จ" }, { status: 500 });
  }
}
