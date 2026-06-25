"use client";
import { useCallback, useEffect, useState } from "react";

interface Item { id: string; title: string; body: string; pinned: boolean; createdAt: string; }

export default function BoardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [pinned, setPinned] = useState(false);

  const load = useCallback(async () => {
    const [s, b] = await Promise.all([fetch("/api/session?module=board"), fetch("/api/board")]);
    try { setIsAdmin((await s.json()).isAdmin); } catch {}
    try { setItems((await b.json()).items || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post() {
    if (!title.trim() || !body.trim()) return;
    await fetch("/api/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, pinned }) });
    setTitle(""); setBody(""); setPinned(false); setAdding(false); load();
  }
  async function del(id: string) { if (!confirm("ลบประกาศนี้?")) return; await fetch(`/api/board/${id}`, { method: "DELETE" }); load(); }

  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand placeholder:text-muted/60";

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-brand">ห้อง 1/2 · ประกาศ</p>
          <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">กระดานประกาศ</h1>
        </div>
        {isAdmin && <button onClick={() => setAdding(true)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">+ ประกาศ</button>}
      </header>

      {adding && (
        <div className="mb-4 space-y-2 rounded-xl2 border border-line bg-surface p-4">
          <input className={field} placeholder="หัวข้อ" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className={field + " min-h-[90px] resize-y"} placeholder="เนื้อหา..." value={body} onChange={(e) => setBody(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> ปักหมุดไว้บนสุด</label>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl border border-line px-4 py-2 text-sm text-muted">ยกเลิก</button>
            <button onClick={post} className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">โพสต์</button>
          </div>
        </div>
      )}

      {loading ? <div className="h-24 animate-pulse rounded-xl2 border border-line bg-surface" /> :
        items.length === 0 ? <p className="rounded-xl2 border border-dashed border-line bg-surface/60 py-16 text-center text-muted">ยังไม่มีประกาศ</p> :
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className={`rounded-xl2 border bg-surface p-4 shadow-card ${it.pinned ? "border-brand/40" : "border-line"}`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-fg">{it.pinned && <span className="mr-1">📌</span>}{it.title}</h2>
                {isAdmin && <button onClick={() => del(it.id)} className="shrink-0 text-xs text-coral hover:underline">ลบ</button>}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{it.body}</p>
              <p className="mt-2 text-xs text-muted">{new Date(it.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
          ))}
        </div>}
      {!isAdmin && !loading && <p className="mt-4 text-center text-xs text-muted">โหมดดูอย่างเดียว</p>}
    </div>
  );
}
