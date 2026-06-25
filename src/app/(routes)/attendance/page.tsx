"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "PRESENT" | "LATE" | "LEAVE" | "ABSENT";
interface Student { id: string; name: string; }
interface SummaryRow { id: string; name: string; PRESENT: number; LATE: number; LEAVE: number; ABSENT: number; }

const STATUS: { key: Status; label: string; cls: string; active: string }[] = [
  { key: "PRESENT", label: "มา", cls: "text-emerald-400", active: "bg-emerald-500 text-white border-emerald-500" },
  { key: "LATE", label: "สาย", cls: "text-amber-400", active: "bg-amber-500 text-white border-amber-500" },
  { key: "LEAVE", label: "ลา", cls: "text-brand", active: "bg-brand text-white border-brand" },
  { key: "ABSENT", label: "ขาด", cls: "text-coral", active: "bg-coral text-white border-coral" },
];

function today() { return new Date().toISOString().slice(0, 10); }

export default function AttendancePage() {
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"daily" | "summary">("daily");
  const [summary, setSummary] = useState<SummaryRow[]>([]);

  const loadDay = useCallback(async (d: string) => {
    try {
      setErr("");
      const [sRes, aRes] = await Promise.all([
        fetch("/api/session?module=attendance"),
        fetch(`/api/attendance?date=${d}`),
      ]);
      if (!aRes.ok) throw new Error();
      const a = await aRes.json();
      setStudents(a.students);
      setStatus(a.status || {});
      try { setIsAdmin((await sRes.json()).isAdmin); } catch { setIsAdmin(false); }
    } catch {
      setErr("โหลดข้อมูลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูล");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDay(date); }, [date, loadDay]);

  async function loadSummary() {
    const res = await fetch("/api/attendance/summary");
    if (res.ok) setSummary((await res.json()).summary);
  }
  useEffect(() => { if (view === "summary") loadSummary(); }, [view]);

  async function setOne(studentId: string, s: Status) {
    if (!isAdmin) return;
    setStatus((prev) => ({ ...prev, [studentId]: s })); // optimistic
    await fetch("/api/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date, status: s }),
    });
  }

  async function markAllPresent() {
    if (!isAdmin) return;
    const targets = students.filter((s) => !status[s.id]);
    setStatus((prev) => { const n = { ...prev }; targets.forEach((t) => (n[t.id] = "PRESENT")); return n; });
    await Promise.all(targets.map((t) =>
      fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: t.id, date, status: "PRESENT" }),
      })
    ));
  }

  const counts = useMemo(() => {
    const c = { PRESENT: 0, LATE: 0, LEAVE: 0, ABSENT: 0, unset: 0 };
    students.forEach((s) => {
      const v = status[s.id] as Status | undefined;
      if (v) c[v]++; else c.unset++;
    });
    return c;
  }, [students, status]);

  return (
    <div id="attendance-module" className="mx-auto max-w-3xl px-2 pb-28 pt-4">
      <header className="mb-5">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · เช็คชื่อ</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">เช็คชื่อนักเรียน</h1>
        {!isAdmin && <p className="mt-2 text-sm text-muted">โหมดดูอย่างเดียว — เข้าระบบหัวหน้าที่หน้ากระดานคะแนนเพื่อแก้ไข</p>}
      </header>

      {/* สลับมุมมอง */}
      <div className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1">
        <button onClick={() => setView("daily")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === "daily" ? "bg-brand text-white" : "text-muted hover:text-fg"}`}>เช็ครายวัน</button>
        <button onClick={() => setView("summary")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === "summary" ? "bg-brand text-white" : "text-muted hover:text-fg"}`}>สรุป</button>
      </div>

      {view === "daily" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-none focus:border-brand" />
            {isAdmin && (
              <button onClick={markAllPresent} className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand/20">
                ✓ ที่เหลือมาทั้งหมด
              </button>
            )}
            <span className="ml-auto text-xs text-muted">
              มา {counts.PRESENT} · สาย {counts.LATE} · ลา {counts.LEAVE} · ขาด {counts.ABSENT}
              {counts.unset > 0 && ` · ยังไม่เช็ค ${counts.unset}`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl border border-line bg-surface" />)}</div>
          ) : err ? (
            <div className="rounded-xl2 border border-coral/30 bg-coral/5 p-6 text-center">
              <p className="font-medium text-coral">{err}</p>
              <button onClick={() => loadDay(date)} className="mt-3 rounded-xl border border-coral/40 px-4 py-2 text-sm text-coral hover:bg-coral/10">ลองอีกครั้ง</button>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card">
                  <span className="w-6 shrink-0 text-center text-xs text-muted">{i + 1}</span>
                  <span className="flex-1 truncate font-medium text-fg">{s.name}</span>
                  <div className="flex shrink-0 gap-1.5">
                    {STATUS.map((st) => {
                      const on = status[s.id] === st.key;
                      return (
                        <button key={st.key} onClick={() => setOne(s.id, st.key)} disabled={!isAdmin}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:cursor-default ${on ? st.active : `border-line bg-bg ${st.cls} ${isAdmin ? "hover:border-brand/40" : "opacity-60"}`}`}>
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-sm text-muted">เรียงคนที่ขาด+สายมากสุดขึ้นก่อน</p>
          {summary.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-card">
              <span className="flex-1 truncate font-medium text-fg">{r.name}</span>
              <span className="shrink-0 text-xs text-emerald-400">มา {r.PRESENT}</span>
              <span className="shrink-0 text-xs text-amber-400">สาย {r.LATE}</span>
              <span className="shrink-0 text-xs text-brand">ลา {r.LEAVE}</span>
              <span className="shrink-0 text-xs font-semibold text-coral">ขาด {r.ABSENT}</span>
            </div>
          ))}
          {summary.length === 0 && <p className="rounded-xl border border-dashed border-line bg-surface/60 py-12 text-center text-sm text-muted">ยังไม่มีข้อมูลเช็คชื่อ</p>}
        </div>
      )}
    </div>
  );
}
