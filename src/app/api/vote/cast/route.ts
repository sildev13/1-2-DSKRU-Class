import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { optionId } = await req.json();
    if (!optionId) return NextResponse.json({ error: "ไม่พบตัวเลือก" }, { status: 400 });
    const opt = await prisma.pollOption.findUnique({ where: { id: optionId }, include: { poll: true } });
    if (!opt) return NextResponse.json({ error: "ไม่พบตัวเลือก" }, { status: 404 });
    if (opt.poll.closed) return NextResponse.json({ error: "โพลนี้ปิดแล้ว" }, { status: 400 });
    await prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 } } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "โหวตไม่สำเร็จ" }, { status: 500 });
  }
}
