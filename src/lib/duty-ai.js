// ตรวจรูปเวรด้วย Claude (vision) — ใช้ตอนพิมพ์ "ส่งเวร" ใน LINE แล้วส่งรูปตาม
import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const PROMPT = `นี่คือรูปห้องเรียนที่นักเรียนถ่ายส่งหลังทำเวรทำความสะอาด
ช่วยประเมินว่าห้องดูสะอาดเรียบร้อยหรือไม่ (โต๊ะเก้าอี้เข้าที่ ไม่มีขยะ กระดานสะอาด พื้นเรียบร้อย)
ตอบเป็นภาษาไทย เหตุผลสั้นๆ 1-2 ประโยค`;

const SCHEMA = {
  type: "object",
  properties: {
    clean: { type: "boolean", description: "true ถ้าห้องสะอาดเรียบร้อย" },
    reason: { type: "string", description: "เหตุผลสั้นๆ ภาษาไทย" },
  },
  required: ["clean", "reason"],
  additionalProperties: false,
};

// คืนค่า { clean, reason } หรือ null ถ้าไม่ได้ตั้งค่า ANTHROPIC_API_KEY / เรียกไม่สำเร็จ
export async function assessDutyPhoto(imageBase64, mediaType = "image/jpeg") {
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block) return null;
    const parsed = JSON.parse(block.text);
    return { clean: !!parsed.clean, reason: String(parsed.reason || "").slice(0, 500) };
  } catch (e) {
    console.error("assessDutyPhoto error", e);
    return null;
  }
}
