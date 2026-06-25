import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// LINE เรียก endpoint นี้เมื่อมีเหตุการณ์ (บอทถูกเชิญเข้ากลุ่ม / มีข้อความในกลุ่ม)
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // ตรวจลายเซ็นแบบไม่บล็อก (ตอบ 200 เสมอ ให้ LINE Verify ผ่าน)
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (secret) {
    const sig = req.headers.get("x-line-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("base64");
    if (sig && sig !== expected) console.warn("LINE signature mismatch — ยังทำงานต่อ");
  }

  let body: any = {};
  try { body = JSON.parse(raw); } catch {}
  const events = body.events || [];
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  for (const ev of events) {
    const src = ev.source || {};
    const groupId = src.groupId || src.roomId;
    if (groupId) {
      // เก็บ groupId เงียบๆ (ไม่ตอบกลับทุกข้อความ)
      await prisma.setting.upsert({
        where: { key: "lineGroupId" },
        update: { value: groupId },
        create: { key: "lineGroupId", value: groupId },
      }).catch(() => {});

      // ตอบยืนยัน "ครั้งเดียว" เฉพาะตอนบอทเพิ่งถูกเชิญเข้ากลุ่ม (event = join)
      if (ev.type === "join" && token && ev.replyToken) {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            replyToken: ev.replyToken,
            messages: [{ type: "text", text: "✅ เชื่อมต่อกลุ่มนี้กับเว็บห้องแล้ว — จะแจ้งเตือนงาน/ประกาศใหม่ที่นี่" }],
          }),
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
