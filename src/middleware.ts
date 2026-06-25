import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "session";

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ตรวจ token แบบ edge (Web Crypto)
async function valid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const userId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(userId));
  return toHex(mac) === sig;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ปล่อยผ่าน: หน้า login, API auth, ไฟล์ระบบ/รูป
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/line") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const ok = await valid(req.cookies.get(COOKIE)?.value);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // ถ้าเป็น API ให้ตอบ 401 แทน redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
    }
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
