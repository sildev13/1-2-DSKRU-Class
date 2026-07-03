"use client";
import { useCallback, useEffect, useState } from "react";

interface Period { id: string; day: string; period: number; subject: string; teacher: string | null; room: string | null; startTime: string | null; endTime: string | null; }
const DAYS = [
  { key: "MON", label: "จันทร์" }, { key: "TUE", label: "อังคาร" }, { key: "WED", label: "พุธ" },
  { key: "THU", label: "พฤหัสบดี" }, { key: "FRI", label: "ศุกร์" },
];
const TODAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()];

const emptyForm = { period: "", subject: "", teacher: "", room: "", startTime: "", endTime: "" };

export default function SchedulePage() {
  const [byDay, setByDay] = useState<Record<string, Period[]>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, d] = await Promise.all([fetch("/api/session?module=schedule"), fetch("/api/schedule")]);
      const sj = await s.json();
      const dj = await d.json();
      setIsAdmin(Boolean(sj.isAdmin));
      if (dj.error) setError(dj.error);
      setByDay(dj.byDay || {});
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(day: string) {
    if (!form.subject.trim() || !form.period || busy) return;
    setBusy(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, ...form, period: Number(form.period) }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "บันทึกไม่สำเร็จ"); return; }
    setForm(emptyForm);
    setEditingDay(null);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · ตารางเรียน</p>
        <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">ตารางเรียนประจำสัปดาห์</h1>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">{DAYS.map((d) => <div key={d.key} className="h-16 animate-pulse rounded-xl border border-line bg-surface" />)}</div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((d) => {
            const list = (byDay[d.key] || []).slice().sort((a, b) => a.period - b.period);
            const isToday = d.key === TODAY;
            return (
              <div key={d.key} className={`rounded-xl2 border bg-surface p-3 shadow-card ${isToday ? "border-brand/50 ring-1 ring-brand/30" : "border-line"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-fg">{d.label}</span>
                  {isToday && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">วันนี้</span>}
                </div>

                {list.length === 0 ? (
                  <p className="text-xs text-muted">ยังไม่มีตารางเรียน</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-lg bg-brand-soft px-2.5 py-1.5 text-sm text-fg">
                        <span className="shrink-0 rounded bg-bg/40 px-1.5 py-0.5 text-xs text-muted">คาบ {p.period}</span>
                        <span className="flex-1 truncate">
                          {p.subject}
                          {p.teacher && <span className="text-muted"> · ครู{p.teacher}</span>}
                          {p.room && <span className="text-muted"> · ห้อง {p.room}</span>}
                          {(p.startTime || p.endTime) && <span className="text-muted"> · {p.startTime || "?"}-{p.endTime || "?"}</span>}
                        </span>
                        {isAdmin && <button onClick={() => remove(p.id)} className="text-coral hover:text-coral/70">✕</button>}
                      </li>
                    ))}
                  </ul>
                )}

                {isAdmin && (
                  editingDay === d.key ? (
                    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-line p-2.5">
                      <div className="flex gap-2">
                        <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} type="number" min={1}
                          placeholder="คาบที่" className="w-20 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                        <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                          placeholder="วิชา" className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <input value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
                          placeholder="ครูผู้สอน (ไม่ใส่ก็ได้)" className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                        <input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                          placeholder="ห้อง" className="w-24 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <input value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                          placeholder="เวลาเริ่ม เช่น 08:30" className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                        <input value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                          placeholder="เวลาจบ" className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => submit(d.key)} disabled={busy} className="flex-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                          {busy ? "กำลังบันทึก…" : "บันทึก"}
                        </button>
                        <button onClick={() => { setEditingDay(null); setForm(emptyForm); }} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted">ยกเลิก</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingDay(d.key); setForm(emptyForm); }}
                      className="mt-2 rounded-lg border border-dashed border-line px-2.5 py-1 text-xs text-muted hover:border-brand/40 hover:text-brand">
                      + เพิ่มคาบเรียน
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isAdmin && !loading && (
        <p className="mt-4 text-center text-xs text-muted">โหมดดูอย่างเดียว — เข้าระบบหัวหน้าที่หน้ากระดานคะแนนเพื่อแก้ไข</p>
      )}
    </div>
  );
}
