import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id] — แก้ไขงาน
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title.trim();
    if ("description" in body) data.description = body.description?.trim() || null;
    if ("subject" in body) data.subject = body.subject?.trim() || null;
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.priority === "string") data.priority = body.priority;
    if ("assignee" in body) data.assignee = body.assignee?.trim() || null;
    if ("link" in body) data.link = body.link?.trim() || null;
    if ("tags" in body) data.tags = body.tags?.trim() || null;
    if ("dueDate" in body)
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "แก้ไขงานไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — ลบงาน (งานย่อยถูกลบตามด้วย onDelete: Cascade)
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "ลบงานไม่สำเร็จ" }, { status: 500 });
  }
}
