import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const [item, students, payments] = await Promise.all([
      prisma.feeItem.findUnique({ where: { id } }),
      prisma.student.findMany({ orderBy: { name: "asc" } }),
      prisma.payment.findMany({ where: { feeItemId: id } }),
    ]);
    if (!item) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    const paidSet = new Set(payments.filter((p) => p.paid).map((p) => p.studentId));
    const rows = students.map((s) => ({ studentId: s.id, name: s.name, paid: paidSet.has(s.id) }));
    return NextResponse.json({
      item,
      rows,
      collected: paidSet.size * item.amount,
      outstanding: (students.length - paidSet.size) * item.amount,
    });
  } catch (e) {
    console.error("GET /api/money/[id]", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await canEdit('money'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.feeItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
