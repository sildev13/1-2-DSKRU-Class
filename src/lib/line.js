// แจ้งเตือนเข้ากลุ่ม LINE — ใช้ Flex Message (การ์ดสวยๆ มีแถบสี + ปุ่มเปิดเว็บ)
import { prisma } from "@/lib/prisma";

const SITE = process.env.SITE_URL || "https://room1-2.suphason.space";

async function getGroupId() {
  if (process.env.LINE_GROUP_ID) return process.env.LINE_GROUP_ID;
  try {
    const s = await prisma.setting.findUnique({ where: { key: "lineGroupId" } });
    return s?.value || null;
  } catch {
    return null;
  }
}

async function pushLine(messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { ok: false, skipped: true };
  const to = await getGroupId();
  if (!to) return { ok: false, skipped: true, reason: "no-group" };
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, messages }),
    });
    if (!res.ok) {
      console.error("LINE push failed", res.status, await res.text().catch(() => ""));
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("LINE push error", e);
    return { ok: false };
  }
}

// ข้อความธรรมดา (เผื่อใช้)
export async function notifyLine(text) {
  return pushLine([{ type: "text", text: String(text).slice(0, 4900) }]);
}

// การ์ดสวยๆ: แถบสีหัว + รายละเอียด + ปุ่มเปิดเว็บ
// rows = แถวข้อความ (แถวแรกตัวหนา/ใหญ่กว่าเป็นหัวข้อหลัก)
/**
 * @param {{accent?:string, icon?:string, title?:string, rows?:any[], path?:string, urlLabel?:string}} o
 */
export async function notifyCard(o = {}) {
  const { accent = "#2563EB", icon = "🔔", title = "แจ้งเตือน", rows = [], path = "", urlLabel = "เปิดเว็บห้อง" } = o;
  const clean = rows.filter((r) => r && String(r).trim());
  const bodyContents = clean.length
    ? clean.map((r, i) => ({
        type: "text",
        text: String(r),
        wrap: true,
        size: i === 0 ? "md" : "sm",
        weight: i === 0 ? "bold" : "regular",
        color: i === 0 ? "#1F2937" : "#5B6470",
        margin: i === 0 ? "none" : "md",
      }))
    : [{ type: "text", text: "-", size: "sm", color: "#9CA3AF" }];

  const bubble = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", paddingAll: "16px", backgroundColor: accent,
      contents: [{ type: "text", text: `${icon}  ${title}`, color: "#FFFFFF", weight: "bold", size: "lg", wrap: true }],
    },
    body: {
      type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: bodyContents,
    },
    footer: {
      type: "box", layout: "vertical", paddingAll: "12px",
      contents: [{
        type: "button", style: "primary", color: accent, height: "sm",
        action: { type: "uri", label: urlLabel, uri: SITE + path },
      }],
    },
    styles: { footer: { separator: true } },
  };

  return pushLine([{ type: "flex", altText: `${icon} ${title}`, contents: bubble }]);
}
