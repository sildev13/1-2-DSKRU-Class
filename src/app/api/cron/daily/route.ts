import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCard } from "@/lib/line";

export const dynamic = "force-dynamic";

const DAY_TH: Record<string, string> = { MON: "จันทร์", TUE: "อังคาร", WED: "พุธ", THU: "พฤหัสบดี", FRI: "ศุกร์", SAT: "เสาร์", SUN: "อาทิตย์" };
const SHORT_TO_KEY: Record<string, string> = { Mon: "MON", Tue: "TUE", Wed: "WED", Thu: "THU", Fri: "FRI", Sat: "SAT", Sun: "SUN" };

// เรียกโดย Vercel Cron ทุกเช้า (ดู vercel.json) — สรุปเวรวันนี้ + งานครบกำหนดพรุ่งนี้
export async function GET(req: NextRequest) {
  // ป้องกันคนอื่นเรียก (ถ้าตั้ง CRON_SECRET) — Vercel จะแนบ header ให้เอง
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // วันนี้ตามเวลาไทย
  const todayShort = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "short" }).format(now);
  const dayKey = SHORT_TO_KEY[todayShort] || "MON";
  const todayBkk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  // ช่วงเวลา "พรุ่งนี้" (เที่ยงคืนไทย ถึงเที่ยงคืนถัดไป)
  const tStart = new Date(`${todayBkk}T00:00:00+07:00`);
  tStart.setDate(tStart.getDate() + 1);
  const tEnd = new Date(tStart.getTime() + 24 * 60 * 60 * 1000);

  const sections: string[] = [];

  // เวรวันนี้ (ข้ามเสาร์-อาทิตย์)
  if (dayKey !== "SAT" && dayKey !== "SUN") {
    const duty = await prisma.dutyAssignment.findMany({ where: { day: dayKey }, include: { student: { select: { name: true } } } });
    const names = duty.map((d) => d.student?.name).filter(Boolean);
    if (names.length) sections.push(`🧹 เวรวันนี้: ${names.join(", ")}`);
  }

  // งานครบกำหนดพรุ่งนี้ (ยังไม่เสร็จ)
  const due = await prisma.task.findMany({
    where: { status: { not: "DONE" }, dueDate: { gte: tStart, lt: tEnd } },
    select: { title: true, subject: true },
  });
  if (due.length) {
    const list = due.map((t) => `• ${t.title}${t.subject ? ` (${t.subject})` : ""}`).join("\n");
    sections.push(`⏰ พรุ่งนี้ครบกำหนด:\n${list}`);
  }

  if (sections.length === 0) return NextResponse.json({ ok: true, sent: false });

  const dateLabel = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short" }).format(now);
  const r = await notifyCard({ accent: "#0EA5E9", icon: "☀️", title: `สรุปเช้านี้ · วัน${DAY_TH[dayKey]} ${dateLabel}`, rows: sections, path: "/dashboard", urlLabel: "เปิดเว็บห้อง" });
  return NextResponse.json({ ok: true, sent: true, line: r });
}
