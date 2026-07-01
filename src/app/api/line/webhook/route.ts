import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { replyLine, buildCardBubble } from "@/lib/line";
import { assessDutyPhoto } from "@/lib/duty-ai";

export const dynamic = "force-dynamic";

const SHORT_TO_KEY: Record<string, string> = { Mon: "MON", Tue: "TUE", Wed: "WED", Thu: "THU", Fri: "FRI", Sat: "SAT", Sun: "SUN" };
const PENDING_MS = 10 * 60 * 1000; // เวลาที่รอรูปหลังพิมพ์ "ส่งเวร"

function todayBkk() {
  const now = new Date();
  const short = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "short" }).format(now);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return { day: SHORT_TO_KEY[short] || "MON", date };
}

async function getMemberName(source: any, token: string) {
  try {
    const url = source.groupId
      ? `https://api.line.me/v2/bot/group/${source.groupId}/member/${source.userId}`
      : source.roomId
      ? `https://api.line.me/v2/bot/room/${source.roomId}/member/${source.userId}`
      : null;
    if (!url) return null;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const j = await res.json();
    return j.displayName || null;
  } catch {
    return null;
  }
}

async function handleSendDutyText(userId: string, replyToken: string) {
  const { day } = todayBkk();
  if (day === "SAT" || day === "SUN") {
    await replyLine(replyToken, [{ type: "text", text: "วันนี้ไม่มีเวรครับ/ค่ะ 🎉" }]);
    return;
  }
  await prisma.setting.upsert({
    where: { key: `dutyPending:${userId}` },
    update: { value: String(Date.now() + PENDING_MS) },
    create: { key: `dutyPending:${userId}`, value: String(Date.now() + PENDING_MS) },
  });
  await replyLine(replyToken, [{ type: "text", text: "📸 ส่งรูปห้องหลังทำความสะอาดมาได้เลย (ภายใน 10 นาที) เดี๋ยวบอทตรวจให้ครับ" }]);
}

async function handleDutyPhoto(ev: any, token: string) {
  const userId = ev.source?.userId;
  const replyToken = ev.replyToken;
  if (!userId) return;

  const pendingKey = `dutyPending:${userId}`;
  const pending = await prisma.setting.findUnique({ where: { key: pendingKey } });
  if (!pending || Number(pending.value) < Date.now()) return; // ไม่ได้อยู่ในช่วงรอส่งเวร — ปล่อยผ่าน

  await prisma.setting.delete({ where: { key: pendingKey } }).catch(() => {});

  const contentRes = await fetch(`https://api-data.line.me/v2/bot/message/${ev.message.id}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentRes.ok) {
    await replyLine(replyToken, [{ type: "text", text: "ดึงรูปไม่สำเร็จ ลองส่งใหม่อีกครั้งครับ" }]);
    return;
  }
  const mediaType = contentRes.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await contentRes.arrayBuffer());
  const imageBase64 = buf.toString("base64");

  const result = await assessDutyPhoto(imageBase64, mediaType);
  if (!result) {
    await replyLine(replyToken, [{ type: "text", text: "ตอนนี้ตรวจรูปด้วย AI ไม่ได้ (ยังไม่ได้ตั้งค่า) ลองแจ้งหัวหน้าห้องครับ" }]);
    return;
  }

  const { day, date } = todayBkk();
  const lineName = await getMemberName(ev.source, token);
  await prisma.dutySubmission.create({
    data: { date, day, lineUserId: userId, lineName, clean: result.clean, reason: result.reason },
  });

  const bubble = buildCardBubble({
    accent: result.clean ? "#16A34A" : "#DC2626",
    icon: result.clean ? "✅" : "🧹",
    title: result.clean ? "ห้องสะอาดเรียบร้อย" : "ยังไม่ค่อยสะอาด",
    rows: [lineName ? `เวรวันนี้: ${lineName}` : "ส่งรูปเวรวันนี้", result.reason],
    path: "/duty",
    urlLabel: "เปิดหน้าเวร",
  });
  await replyLine(replyToken, [{ type: "flex", altText: result.clean ? "✅ ห้องสะอาดเรียบร้อย" : "🧹 ยังไม่ค่อยสะอาด", contents: bubble }]);
}

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

    if (ev.type === "message" && token) {
      if (ev.message?.type === "text" && ev.message.text?.trim() === "ส่งเวร" && ev.source?.userId) {
        await handleSendDutyText(ev.source.userId, ev.replyToken).catch((e) => console.error("handleSendDutyText", e));
      } else if (ev.message?.type === "image") {
        await handleDutyPhoto(ev, token).catch((e) => console.error("handleDutyPhoto", e));
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
