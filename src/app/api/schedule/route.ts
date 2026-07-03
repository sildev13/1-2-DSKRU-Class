import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export async function GET() {
  try {
    const rows = await prisma.classSchedule.findMany({ orderBy: [{ day: "asc" }, { period: "asc" }] });
    const byDay: Record<string, typeof rows> = {};
    DAYS.forEach((d) => (byDay[d] = []));
    rows.forEach((r) => {
      if (!byDay[r.day]) byDay[r.day] = [];
      byDay[r.day].push(r);
    });
    return NextResponse.json({ byDay });
  } catch (e) {
    console.error("GET /api/schedule", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await canEdit("schedule"))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const day = body.day;
    const period = Number(body.period);
    const subject = (body.subject || "").trim();
    const teacher = (body.teacher || "").trim() || null;
    const room = (body.room || "").trim() || null;
    const startTime = (body.startTime || "").trim() || null;
    const endTime = (body.endTime || "").trim() || null;
    if (!DAYS.includes(day) || !Number.isFinite(period) || period < 1 || !subject) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const row = await prisma.classSchedule.upsert({
      where: { day_period: { day, period } },
      update: { subject, teacher, room, startTime, endTime },
      create: { day, period, subject, teacher, room, startTime, endTime },
    });
    return NextResponse.json({ row }, { status: 201 });
  } catch (e) {
    console.error("POST /api/schedule", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await canEdit("schedule"))) return NextResponse.json({ error: "ต้องเข้าสู่ระบบหัวหน้าก่อน" }, { status: 401 });
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
    await prisma.classSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
