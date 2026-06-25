import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// POST /api/tasks/[id]/subtasks — เพิ่มงานย่อยให้กับงาน
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "กรุณาใส่ชื่องานย่อย" }, { status: 400 });
    }
    const subtask = await prisma.subtask.create({
      data: { title: body.title.trim(), taskId: id },
    });
    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("POST subtasks error:", error);
    return NextResponse.json({ error: "เพิ่มงานย่อยไม่สำเร็จ" }, { status: 500 });
  }
}
