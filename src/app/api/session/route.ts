import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const moduleKey = new URL(req.url).searchParams.get("module");
  const canEdit = !!user && (user.isHead || (moduleKey ? user.perms.includes(moduleKey) : false));
  return NextResponse.json({
    isAdmin: canEdit, // เพื่อให้หน้าเดิมใช้ได้ (isAdmin = แก้ระบบนี้ได้)
    isHead: !!user?.isHead,
    perms: user?.perms || [],
    user: user ? { username: user.username, name: user.name, isHead: user.isHead } : null,
  });
}
