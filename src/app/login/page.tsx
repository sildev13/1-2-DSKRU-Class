"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") || "/dashboard";
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally { setBusy(false); }
  }

  const field = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-fg outline-none focus:border-brand placeholder:text-muted/60";

  return (
    <div className="aura-scope flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl2 border border-line bg-surface p-7 shadow-card">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 DSKRU</p>
        <h1 className="mt-1 mb-6 text-2xl font-bold text-fg">เข้าสู่ระบบ</h1>
        <div className="space-y-3">
          <input className={field} placeholder="ชื่อผู้ใช้" autoFocus value={username}
            onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <input className={field} type="password" placeholder="รหัสผ่าน" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {err && <p className="mt-3 text-sm text-coral">{err}</p>}
        <button onClick={submit} disabled={busy}
          className="mt-5 w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {busy ? "กำลังเข้า..." : "เข้าสู่ระบบ"}
        </button>
      </div>
    </div>
  );
}
