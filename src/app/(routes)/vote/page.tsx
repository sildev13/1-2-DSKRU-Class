"use client";
import { useCallback, useEffect, useState } from "react";

interface Option { id: string; text: string; votes: number; }
interface Poll { id: string; question: string; closed: boolean; options: Option[]; }

export default function VotePage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState(""); const [opts, setOpts] = useState(["", ""]);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([fetch("/api/session?module=vote"), fetch("/api/vote")]);
    try { setIsAdmin((await s.json()).isAdmin); } catch {}
    try { setPolls((await p.json()).polls || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    try { setVoted(JSON.parse(localStorage.getItem("pollVoted") || "{}")); } catch {}
  }, [load]);

  async function cast(pollId: string, optionId: string) {
    if (voted[pollId]) return;
    const nv = { ...voted, [pollId]: true }; setVoted(nv);
    try { localStorage.setItem("pollVoted", JSON.stringify(nv)); } catch {}
    await fetch("/api/vote/cast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId }) });
    load();
  }
  async function createPoll() {
    const clean = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || clean.length < 2) return;
    await fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, options: clean }) });
    setQ(""); setOpts(["", ""]); setAdding(false); load();
  }
  async function close(id: string, closed: boolean) { await fetch(`/api/vote/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ closed }) }); load(); }
  async function del(id: string) { if (!confirm("ลบโพลนี้?")) return; await fetch(`/api/vote/${id}`, { method: "DELETE" }); load(); }

  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand placeholder:text-muted/60";

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-brand">ห้อง 1/2 · โหวต</p>
          <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">โหวต / สำรวจ</h1>
        </div>
        {isAdmin && <button onClick={() => setAdding(true)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">+ สร้างโพล</button>}
      </header>

      {adding && (
        <div className="mb-4 space-y-2 rounded-xl2 border border-line bg-surface p-4">
          <input className={field} placeholder="คำถาม เช่น เลือกสีเสื้อกีฬาสี" value={q} onChange={(e) => setQ(e.target.value)} />
          {opts.map((o, i) => (
            <input key={i} className={field} placeholder={`ตัวเลือกที่ ${i + 1}`} value={o}
              onChange={(e) => setOpts((prev) => prev.map((x, j) => j === i ? e.target.value : x))} />
          ))}
          <button onClick={() => setOpts((p) => [...p, ""])} className="text-xs text-brand hover:underline">+ เพิ่มตัวเลือก</button>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl border border-line px-4 py-2 text-sm text-muted">ยกเลิก</button>
            <button onClick={createPoll} className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">สร้าง</button>
          </div>
        </div>
      )}

      {loading ? <div className="h-32 animate-pulse rounded-xl2 border border-line bg-surface" /> :
        polls.length === 0 ? <p className="rounded-xl2 border border-dashed border-line bg-surface/60 py-16 text-center text-muted">ยังไม่มีโพล</p> :
        <div className="space-y-4">
          {polls.map((p) => {
            const total = p.options.reduce((a, o) => a + o.votes, 0);
            const done = voted[p.id] || p.closed;
            return (
              <div key={p.id} className="rounded-xl2 border border-line bg-surface p-4 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-fg">{p.question}{p.closed && <span className="ml-2 text-xs text-coral">(ปิดแล้ว)</span>}</h2>
                  {isAdmin && <div className="flex shrink-0 gap-2 text-xs">
                    <button onClick={() => close(p.id, !p.closed)} className="text-brand hover:underline">{p.closed ? "เปิด" : "ปิด"}</button>
                    <button onClick={() => del(p.id)} className="text-coral hover:underline">ลบ</button>
                  </div>}
                </div>
                <div className="space-y-2">
                  {p.options.map((o) => {
                    const pct = total ? Math.round((o.votes / total) * 100) : 0;
                    return (
                      <button key={o.id} disabled={done} onClick={() => cast(p.id, o.id)}
                        className={`relative w-full overflow-hidden rounded-xl border border-line px-3 py-2 text-left text-sm transition ${done ? "cursor-default" : "hover:border-brand/50"}`}>
                        {done && <span className="absolute inset-y-0 left-0 bg-brand/20" style={{ width: `${pct}%` }} />}
                        <span className="relative flex justify-between">
                          <span className="text-fg">{o.text}</span>
                          {done && <span className="text-muted">{o.votes} ({pct}%)</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">{done ? `รวม ${total} โหวต` : "แตะเพื่อโหวต (1 ครั้ง/เครื่อง)"}</p>
              </div>
            );
          })}
        </div>}
    </div>
  );
}
