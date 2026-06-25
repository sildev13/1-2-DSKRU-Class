import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    const todayKey = DOW[new Date().getDay()];
    const todayStr = new Date().toISOString().slice(0, 10);

    const [tasks, students, feeItems, announcements, dutyToday, topStudents] = await Promise.all([
      prisma.task.findMany({ select: { id: true, title: true, status: true, dueDate: true, subject: true } }),
      prisma.student.count(),
      prisma.feeItem.findMany({ include: { payments: { where: { paid: true }, select: { id: true } } } }),
      prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
      prisma.dutyAssignment.findMany({ where: { day: todayKey }, include: { student: { select: { name: true } } } }),
      prisma.student.findMany({ orderBy: { points: "desc" }, take: 3, select: { name: true, points: true } }),
    ]);

    const notDone = tasks.filter((t) => t.status !== "DONE");
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = notDone
      .filter((t) => t.dueDate)
      .map((t) => ({ ...t, due: new Date(t.dueDate as any) }))
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id, title: t.title, subject: t.subject,
        dueDate: t.dueDate,
        overdue: t.due < now,
        soon: t.due >= now && t.due <= soon,
      }));

    const money = feeItems
      .map((f) => ({ id: f.id, title: f.title, amount: f.amount, paidCount: f.payments.length, totalStudents: students }))
      .filter((f) => f.paidCount < f.totalStudents)
      .map((f) => ({ ...f, remaining: f.totalStudents - f.paidCount, outstanding: (f.totalStudents - f.paidCount) * f.amount }));

    return NextResponse.json({
      user: user ? { username: user.username, name: user.name, isHead: user.isHead } : null,
      tasks: {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "TODO").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        done: tasks.filter((t) => t.status === "DONE").length,
        notDone: notDone.length,
        upcoming,
      },
      dutyToday: { day: todayKey, isWeekend: todayKey === "SAT" || todayKey === "SUN", names: dutyToday.map((d) => d.student?.name || "") },
      announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, createdAt: a.createdAt })),
      money,
      topStudents,
      date: todayStr,
    });
  } catch (e) {
    console.error("GET /api/dashboard", e);
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
