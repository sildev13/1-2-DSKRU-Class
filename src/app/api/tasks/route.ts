import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCard } from "@/lib/line";

export const dynamic = "force-dynamic";

// GET /api/tasks — ดึงงานทั้งหมด พร้อมงานย่อย
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const subject = searchParams.get("subject") || undefined;

    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(subject ? { subject } : {}),
      },
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลงานไม่สำเร็จ" }, { status: 500 });
  }
}

// POST /api/tasks — สร้างงานใหม่ (พร้อมงานย่อยได้)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "กรุณาใส่ชื่องาน" }, { status: 400 });
    }

    const subtaskTitles: string[] = Array.isArray(body.subtasks)
      ? body.subtasks
          .map((s: unknown) => (typeof s === "string" ? s : (s as any)?.title))
          .map((s: string) => (s || "").trim())
          .filter(Boolean)
      : [];

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        subject: body.subject?.trim() || null,
        status: body.status || "TODO",
        priority: body.priority || "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignee: body.assignee?.trim() || null,
        link: body.link?.trim() || null,
        tags: body.tags?.trim() || null,
        subtasks: subtaskTitles.length
          ? { create: subtaskTitles.map((title) => ({ title })) }
          : undefined,
      },
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
    });

    if (process.env.LINE_NOTIFY_TASKS !== "false") {
      const due = task.dueDate ? `⏰ กำหนดส่ง ${new Date(task.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}` : "";
      await notifyCard({ accent: "#2563EB", icon: "📋", title: "งานใหม่", rows: [task.title, task.subject ? `วิชา ${task.subject}` : "", due], path: "/tasks", urlLabel: "ดูงานทั้งหมด" });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "สร้างงานไม่สำเร็จ" }, { status: 500 });
  }
}
