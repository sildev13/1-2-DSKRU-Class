import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCard } from "@/lib/line";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: { options: { orderBy: { id: "asc" } } },
    });
    return NextResponse.json({ polls });
  } catch (e) {
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await canEdit('vote'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { question, options } = await req.json();
    const opts = (Array.isArray(options) ? options : []).map((o: string) => o.trim()).filter(Boolean);
    if (!question?.trim() || opts.length < 2) {
      return NextResponse.json({ error: "ใส่คำถามและตัวเลือกอย่างน้อย 2 ตัว" }, { status: 400 });
    }
    const poll = await prisma.poll.create({
      data: { question: question.trim(), options: { create: opts.map((text: string) => ({ text })) } },
      include: { options: true },
    });
    await notifyCard({ accent: "#8B5CF6", icon: "🗳️", title: "โหวตใหม่", rows: [poll.question, "เข้าไปโหวตได้เลย"], path: "/vote", urlLabel: "ไปโหวต" });
    return NextResponse.json({ poll }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "สร้างโพลไม่สำเร็จ" }, { status: 500 });
  }
}
