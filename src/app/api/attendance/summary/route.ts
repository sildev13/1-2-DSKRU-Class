import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [students, records] = await Promise.all([
      prisma.student.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.attendance.findMany(),
    ]);

    const counts: Record<string, { PRESENT: number; LATE: number; LEAVE: number; ABSENT: number }> = {};
    students.forEach((s) => { counts[s.id] = { PRESENT: 0, LATE: 0, LEAVE: 0, ABSENT: 0 }; });
    records.forEach((r) => {
      if (counts[r.studentId] && r.status in counts[r.studentId]) {
        counts[r.studentId][r.status as "PRESENT" | "LATE" | "LEAVE" | "ABSENT"]++;
      }
    });

    const summary = students.map((s) => ({ id: s.id, name: s.name, ...counts[s.id] }));
    // เรียงคนที่ขาด+สายมากสุดขึ้นก่อน
    summary.sort((a, b) => b.ABSENT + b.LATE - (a.ABSENT + a.LATE));
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("GET /api/attendance/summary", e);
    return NextResponse.json({ error: "ดึงสรุปไม่สำเร็จ" }, { status: 500 });
  }
}
