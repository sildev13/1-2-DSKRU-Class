import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await canEdit('money'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { feeItemId, studentId, paid } = await req.json();
    if (!feeItemId || !studentId) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    await prisma.payment.upsert({
      where: { feeItemId_studentId: { feeItemId, studentId } },
      update: { paid: !!paid, paidAt: paid ? new Date() : null },
      create: { feeItemId, studentId, paid: !!paid, paidAt: paid ? new Date() : null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/money/pay", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
