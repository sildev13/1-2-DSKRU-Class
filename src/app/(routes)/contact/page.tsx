import { Link } from "@nextui-org/link";
// ลบ import NextLink from "next/link"; ออกแล้ว

// ใส่ชื่อ Function ให้เรียบร้อย
export default function ContactLinks() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="shadow m-2 p-6 rounded-xl bg-white/5">
          <p>Instagram ห้อง</p>
          <Link
            isExternal
            showAnchorIcon
            // ลบ as={NextLink} ออก
            href={"https://www.instagram.com/dskru.m12.survive/"}
            className="font-bold"
            color="success"
          >
            IG : dskru.m12.survive 
          </Link>
        </div>
        <div className="shadow m-2 p-6 rounded-xl bg-white/5">
          <p>Contact Developer</p>
          <Link
            isExternal
            showAnchorIcon
            // ลบ as={NextLink} ออก
            href={"mailto:nongsin@suphason.space"}
            className="font-bold"
            color="warning"
          >
            nongsin@suphason.space
          </Link>
        </div>
        <div className="shadow m-2 p-6 rounded-xl bg-white/5">
          <p>Discord</p>
          <Link
            isExternal
            showAnchorIcon
            // ลบ as={NextLink} ออก
            href={"https://discord.gg/XzHXsykv29"}
            className="font-bold"
            color="success"
          >
            — 🛸 𝔻𝕊𝕂ℝ𝕌 𝕄.𝟙/𝟚 🪐 —
          </Link>
        </div>
      </div>
    </>
  );
}