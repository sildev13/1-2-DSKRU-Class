"use client";
import { useCallback, useEffect, useState } from "react";

interface Item { id: string; title: string; amount: number; paidCount: number; totalStudents: number; collected: number; target: number; }
interface Row { studentId: string; name: string; paid: boolean; }

export default function MoneyPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([fetch("/api/session?module=money"), fetch("/api/money")]);
    try { setIsAdmin((await s.json()).isAdmin); } catch {}
    try { setItems((await m.json()).items || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openItem(id: string) {
    if (open === id) { setOpen(null); return; }
    setOpen(id); setRows([]);
    const r = await fetch(`/api/money/${id}`);
    if (r.ok) setRows((await r.json()).rows);
  }
  async function togglePay(feeItemId: string, studentId: string, paid: boolean) {
    if (!isAdmin) return;
    setRows((prev) => prev.map((r) => r.studentId === studentId ? { ...r, paid } : r));
    await fetch("/api/money/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feeItemId, studentId, paid }) });
    load();
  }
  async function addItem() {
    if (!title.trim() || !amount) return;
    await fetch("/api/money", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, amount: Number(amount) }) });
    setTitle(""); setAmount(""); setAdding(false); load();
  }
  async function delItem(id: string) {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/money/${id}`, { method: "DELETE" }); setOpen(null); load();
  }

  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand placeholder:text-muted/60";

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-brand">ห้อง 1/2 · เก็บเงิน</p>
          <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">เก็บเงินห้อง</h1>
        </div>
        {isAdmin && <button onClick={() => setAdding(true)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">+ รายการ</button>}
      </header>

      {adding && (
        <div className="mb-4 space-y-2 rounded-xl2 border border-line bg-surface p-4">
          <input className={field} placeholder="ชื่อรายการ เช่น เงินห้อง เทอม 1" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={field} placeholder="ยอดต่อคน (บาท)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl border border-line px-4 py-2 text-sm text-muted">ยกเลิก</button>
            <button onClick={addItem} className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">เพิ่ม</button>
          </div>
        </div>
      )}

      {loading ? <div className="h-20 animate-pulse rounded-xl2 border border-line bg-surface" /> :
        items.length === 0 ? <p className="rounded-xl2 border border-dashed border-line bg-surface/60 py-16 text-center text-muted">ยังไม่มีรายการเก็บเงิน</p> :
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="overflow-hidden rounded-xl2 border border-line bg-surface shadow-card">
              <button onClick={() => openItem(it.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <div className="flex-1">
                  <p className="font-semibold text-fg">{it.title}</p>
                  <p className="text-xs text-muted">คนละ {it.amount} บาท · จ่ายแล้ว {it.paidCount}/{it.totalStudents} คน</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{it.collected.toLocaleString()}</p>
                  <p className="text-xs text-muted">/ {it.target.toLocaleString()} บาท</p>
                </div>
              </button>
              {open === it.id && (
                <div className="border-t border-line bg-bg/40 p-3">
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {rows.map((r) => (
                      <button key={r.studentId} disabled={!isAdmin} onClick={() => togglePay(it.id, r.studentId, !r.paid)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${r.paid ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-line bg-surface text-muted"} ${isAdmin ? "hover:border-brand/40" : ""}`}>
                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded ${r.paid ? "bg-emerald-500 text-white" : "border border-line"}`}>{r.paid ? "✓" : ""}</span>
                        <span className="truncate text-fg">{r.name}</span>
                      </button>
                    ))}
                  </div>
                  {isAdmin && <button onClick={() => delItem(it.id)} className="mt-3 text-xs text-coral hover:underline">ลบรายการนี้</button>}
                </div>
              )}
            </div>
          ))}
        </div>}
      {!isAdmin && !loading && <p className="mt-4 text-center text-xs text-muted">โหมดดูอย่างเดียว — เข้าระบบหัวหน้าที่หน้ากระดานคะแนนเพื่อแก้ไข</p>}
    </div>
  );
}
