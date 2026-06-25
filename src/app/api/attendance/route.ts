import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — รายชื่อนักเรียนทั้งหมด + สถานะของวันที่เลือก
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const [students, records] = await Promise.all([
      prisma.student.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.attendance.findMany({ where: { date } }),
    ]);

    const statusByStudent: Record<string, string> = {};
    records.forEach((r) => { statusByStudent[r.studentId] = r.status; });

    return NextResponse.json({
      date,
      students: students.map((s) => ({ id: s.id, name: s.name })),
      status: statusByStudent,
    });
  } catch (e) {
    console.error("GET /api/attendance", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// POST — บันทึกสถานะของนักเรียน 1 คนในวันหนึ่ง (admin)
export async function POST(req: NextRequest) {
  if (!(await canEdit('attendance'))) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  }
  try {
    const { studentId, date, status } = await req.json();
    const valid = ["PRESENT", "LATE", "LEAVE", "ABSENT"];
    if (!studentId || !date || !valid.includes(status)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const rec = await prisma.attendance.upsert({
      where: { studentId_date: { studentId, date } },
      update: { status },
      create: { studentId, date, status },
    });
    return NextResponse.json({ ok: true, record: rec });
  } catch (e) {
    console.error("POST /api/attendance", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
