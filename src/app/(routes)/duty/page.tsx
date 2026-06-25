"use client";
import { useCallback, useEffect, useState } from "react";

interface Assign { id: string; studentId: string; name: string; }
interface Student { id: string; name: string; }
const DAYS = [
  { key: "MON", label: "จันทร์" }, { key: "TUE", label: "อังคาร" }, { key: "WED", label: "พุธ" },
  { key: "THU", label: "พฤหัสบดี" }, { key: "FRI", label: "ศุกร์" },
];
const TODAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()];

export default function DutyPage() {
  const [byDay, setByDay] = useState<Record<string, Assign[]>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([fetch("/api/session?module=duty"), fetch("/api/duty")]);
    try { setIsAdmin((await s.json()).isAdmin); } catch {}
    try { const j = await d.json(); setByDay(j.byDay || {}); setStudents(j.students || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(day: string, studentId: string) {
    await fetch("/api/duty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day, studentId }) });
    setPick(null); load();
  }
  async function remove(id: string) { await fetch(`/api/duty?id=${id}`, { method: "DELETE" }); load(); }

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · เวร</p>
        <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">ตารางเวรทำความสะอาด</h1>
      </header>

      {loading ? <div className="space-y-2">{DAYS.map((d) => <div key={d.key} className="h-16 animate-pulse rounded-xl border border-line bg-surface" />)}</div> :
        <div className="space-y-2">
          {DAYS.map((d) => {
            const list = byDay[d.key] || [];
            const isToday = d.key === TODAY;
            return (
              <div key={d.key} className={`rounded-xl2 border bg-surface p-3 shadow-card ${isToday ? "border-brand/50 ring-1 ring-brand/30" : "border-line"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-fg">{d.label}</span>
                  {isToday && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">วันนี้</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.length === 0 && <span className="text-xs text-muted">ยังไม่มีคนเวร</span>}
                  {list.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1 text-xs text-fg">
                      {a.name}
                      {isAdmin && <button onClick={() => remove(a.id)} className="text-coral hover:text-coral/70">✕</button>}
                    </span>
                  ))}
                  {isAdmin && (
                    pick === d.key ? (
                      <select autoFocus onChange={(e) => e.target.value && add(d.key, e.target.value)} onBlur={() => setPick(null)}
                        className="rounded-lg border border-line bg-bg px-2 py-1 text-xs text-fg outline-none">
                        <option value="">เลือกคน...</option>
                        {students.filter((s) => !list.some((a) => a.studentId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setPick(d.key)} className="rounded-lg border border-dashed border-line px-2.5 py-1 text-xs text-muted hover:border-brand/40 hover:text-brand">+ เพิ่ม</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>}
      {!isAdmin && !loading && <p className="mt-4 text-center text-xs text-muted">โหมดดูอย่างเดียว — เข้าระบบหัวหน้าที่หน้ากระดานคะแนนเพื่อแก้ไข</p>}
    </div>
  );
}
