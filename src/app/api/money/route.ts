import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCard } from "@/lib/line";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [items, totalStudents] = await Promise.all([
      prisma.feeItem.findMany({
        orderBy: { createdAt: "desc" },
        include: { payments: { where: { paid: true } } },
      }),
      prisma.student.count(),
    ]);
    return NextResponse.json({
      items: items.map((it) => ({
        id: it.id,
        title: it.title,
        amount: it.amount,
        paidCount: it.payments.length,
        totalStudents,
        collected: it.payments.length * it.amount,
        target: totalStudents * it.amount,
      })),
    });
  } catch (e) {
    console.error("GET /api/money", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await canEdit('money'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { title, amount } = await req.json();
    if (!title?.trim() || !Number.isFinite(Number(amount))) {
      return NextResponse.json({ error: "ใส่ชื่อรายการและยอดเงิน" }, { status: 400 });
    }
    const item = await prisma.feeItem.create({ data: { title: title.trim(), amount: Number(amount) } });
    await notifyCard({ accent: "#10B981", icon: "💰", title: "เก็บเงินใหม่", rows: [item.title, `คนละ ${item.amount} บาท`], path: "/money", urlLabel: "ดูรายละเอียด" });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/money", e);
    return NextResponse.json({ error: "สร้างรายการไม่สำเร็จ" }, { status: 500 });
  }
}
