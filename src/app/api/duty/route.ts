import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export async function GET() {
  try {
    const [assigns, students] = await Promise.all([
      prisma.dutyAssignment.findMany({ include: { student: { select: { name: true } } } }),
      prisma.student.findMany({ orderBy: { name: "asc" } }),
    ]);
    const byDay: Record<string, { id: string; studentId: string; name: string }[]> = {};
    DAYS.forEach((d) => (byDay[d] = []));
    assigns.forEach((a) => {
      if (!byDay[a.day]) byDay[a.day] = [];
      byDay[a.day].push({ id: a.id, studentId: a.studentId, name: a.student?.name || "" });
    });
    return NextResponse.json({ byDay, students: students.map((s) => ({ id: s.id, name: s.name })) });
  } catch (e) {
    console.error("GET /api/duty", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await canEdit('duty'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const { day, studentId } = await req.json();
    if (!DAYS.includes(day) || !studentId) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const a = await prisma.dutyAssignment.upsert({
      where: { day_studentId: { day, studentId } },
      update: {},
      create: { day, studentId },
    });
    return NextResponse.json({ assignment: a }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "เพิ่มไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await canEdit('duty'))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
    await prisma.dutyAssignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
