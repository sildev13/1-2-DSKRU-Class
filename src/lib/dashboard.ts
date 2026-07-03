import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export async function getDashboardData() {
  const user = await getCurrentUser();
  const todayKey = DOW[new Date().getDay()];
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [taskCounts, upcomingTasks, students, feeItems, announcements, dutyToday, topStudents] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, subject: true, dueDate: true },
    }),
    prisma.student.count(),
    prisma.feeItem.findMany({
      select: { id: true, title: true, amount: true, _count: { select: { payments: { where: { paid: true } } } } },
    }),
    prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
    prisma.dutyAssignment.findMany({ where: { day: todayKey }, include: { student: { select: { name: true } } } }),
    prisma.student.findMany({ orderBy: { points: "desc" }, take: 3, select: { name: true, points: true } }),
  ]);

  const countFor = (status: string) => taskCounts.find((c) => c.status === status)?._count ?? 0;
  const total = taskCounts.reduce((sum, c) => sum + c._count, 0);
  const done = countFor("DONE");

  const upcoming = upcomingTasks.map((t) => {
    const due = new Date(t.dueDate as any);
    return {
      id: t.id, title: t.title, subject: t.subject,
      dueDate: t.dueDate,
      overdue: due < now,
      soon: due >= now && due <= soon,
    };
  });

  const money = feeItems
    .map((f) => ({ id: f.id, title: f.title, amount: f.amount, paidCount: f._count.payments, totalStudents: students }))
    .filter((f) => f.paidCount < f.totalStudents)
    .map((f) => ({ ...f, remaining: f.totalStudents - f.paidCount, outstanding: (f.totalStudents - f.paidCount) * f.amount }));

  return {
    user: user ? { username: user.username, name: user.name, isHead: user.isHead } : null,
    tasks: {
      total,
      todo: countFor("TODO"),
      inProgress: countFor("IN_PROGRESS"),
      done,
      notDone: total - done,
      upcoming,
    },
    dutyToday: { day: todayKey, isWeekend: todayKey === "SAT" || todayKey === "SUN", names: dutyToday.map((d) => d.student?.name || "") },
    announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, createdAt: a.createdAt })),
    money,
    topStudents,
    date: todayStr,
  };
}
