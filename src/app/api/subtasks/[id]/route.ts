import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// PATCH /api/subtasks/[id] — ติ๊ก/แก้ไขงานย่อย
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.done === "boolean") data.done = body.done;
    if (typeof body.title === "string") data.title = body.title.trim();
    const subtask = await prisma.subtask.update({ where: { id }, data });
    return NextResponse.json(subtask);
  } catch (error) {
    console.error("PATCH subtask error:", error);
    return NextResponse.json({ error: "แก้ไขงานย่อยไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/subtasks/[id] — ลบงานย่อย
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.subtask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE subtask error:", error);
    return NextResponse.json({ error: "ลบงานย่อยไม่สำเร็จ" }, { status: 500 });
  }
}
