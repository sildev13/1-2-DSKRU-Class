import { Link } from "@nextui-org/link";

// ตั้งชื่อ Function ให้ด้วยเพื่อความเสถียรของระบบ Next.js
export default function Footer() {
  return (
    <footer className="flex flex-col items-center space-y-1 pb-24">
      <p>
        จัดทำโดย{" "}
        <Link
          isExternal
          showAnchorIcon
          // ลบ as={NextLink} ออกแล้ว
          href={"https://suphason.space/"}
          className="font-bold"
        >
          Suphason Keawbuadee M.1/2
        </Link>
      </p>
      <p>
        {" "}
        <Link
          isExternal
          showAnchorIcon
          // ลบ as={NextLink} ออกแล้ว
          href={"http://dskru.kru.ac.th/"}
          className="font-normal"
        >
          DSKRU Website
        </Link>
      </p>
    </footer>
  );
}