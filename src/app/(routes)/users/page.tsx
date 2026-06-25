"use client";
import { useCallback, useEffect, useState } from "react";

interface U { id: string; username: string; name: string | null; isHead: boolean; perms: string[]; }
const LABEL: Record<string, string> = {
  tasks: "งาน", points: "คะแนน", attendance: "เช็คชื่อ", money: "เก็บเงิน", duty: "เวร", vote: "โหวต", board: "ประกาศ",
};

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nu, setNu] = useState({ username: "", password: "", name: "", isHead: false, perms: [] as string[] });

  const load = useCallback(async () => {
    const r = await fetch("/api/users");
    if (r.status === 403) { setForbidden(true); setLoading(false); return; }
    const d = await r.json();
    setUsers(d.users || []); setModules(d.modules || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: any) {
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }
  function togglePerm(u: U, m: string) {
    const perms = u.perms.includes(m) ? u.perms.filter((p) => p !== m) : [...u.perms, m];
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, perms } : x));
    patch(u.id, { perms });
  }
  async function resetPw(u: U) {
    const p = prompt(`ตั้งรหัสผ่านใหม่ของ ${u.username}:`);
    if (p) patch(u.id, { password: p });
  }
  async function del(u: U) { if (confirm(`ลบผู้ใช้ ${u.username}?`)) { await fetch(`/api/users/${u.id}`, { method: "DELETE" }); load(); } }
  async function create() {
    if (!nu.username.trim() || !nu.password) return;
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nu) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.error || "สร้างไม่สำเร็จ"); return; }
    setNu({ username: "", password: "", name: "", isHead: false, perms: [] }); setAdding(false); load();
  }

  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand placeholder:text-muted/60";

  if (forbidden) return <div className="aura-scope mx-auto max-w-md px-2 pt-16 text-center"><p className="rounded-xl2 border border-coral/30 bg-coral/5 p-8 text-coral">หน้านี้สำหรับหัวหน้าห้องเท่านั้น</p></div>;

  return (
    <div className="aura-scope mx-auto max-w-3xl px-2 pb-28 pt-4">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-brand">ห้อง 1/2 · ผู้ใช้</p>
          <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">จัดการผู้ใช้ & สิทธิ์</h1>
        </div>
        <button onClick={() => setAdding(!adding)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">+ เพิ่มผู้ใช้</button>
      </header>

      {adding && (
        <div className="mb-5 space-y-3 rounded-xl2 border border-line bg-surface p-4">
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder="ชื่อผู้ใช้ (เช่น 69110)" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} />
            <input className={field} placeholder="รหัสผ่าน" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
          </div>
          <input className={field} placeholder="ชื่อ (ไม่บังคับ)" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-fg"><input type="checkbox" checked={nu.isHead} onChange={(e) => setNu({ ...nu, isHead: e.target.checked })} /> เป็นหัวหน้า (ทำได้ทุกอย่าง)</label>
          {!nu.isHead && (
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <button key={m} onClick={() => setNu({ ...nu, perms: nu.perms.includes(m) ? nu.perms.filter((p) => p !== m) : [...nu.perms, m] })}
                  className={`rounded-lg border px-2.5 py-1 text-xs ${nu.perms.includes(m) ? "border-brand bg-brand/20 text-brand" : "border-line text-muted"}`}>{LABEL[m] || m}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl border border-line px-4 py-2 text-sm text-muted">ยกเลิก</button>
            <button onClick={create} className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">สร้าง</button>
          </div>
        </div>
      )}

      {loading ? <div className="h-24 animate-pulse rounded-xl2 border border-line bg-surface" /> :
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl2 border border-line bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-semibold text-fg">{u.username}</span>
                {u.name && <span className="text-sm text-muted">· {u.name}</span>}
                {u.isHead && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">หัวหน้า</span>}
                <div className="ml-auto flex gap-3 text-xs">
                  <button onClick={() => resetPw(u)} className="text-brand hover:underline">เปลี่ยนรหัส</button>
                  <button onClick={() => patch(u.id, { isHead: !u.isHead })} className="text-amber-400 hover:underline">{u.isHead ? "ปลดหัวหน้า" : "ตั้งหัวหน้า"}</button>
                  <button onClick={() => del(u)} className="text-coral hover:underline">ลบ</button>
                </div>
              </div>
              {u.isHead ? <p className="text-xs text-muted">ทำได้ทุกระบบ</p> : (
                <div className="flex flex-wrap gap-2">
                  {modules.map((m) => (
                    <button key={m} onClick={() => togglePerm(u, m)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition ${u.perms.includes(m) ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-line text-muted hover:border-brand/40"}`}>
                      {u.perms.includes(m) ? "✓ " : ""}{LABEL[m] || m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>}
    </div>
  );
}
