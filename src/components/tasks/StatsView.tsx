"use client";

import { useMemo } from "react";
import { STATUS_LABELS, Status, Task } from "@/lib/types";

export default function StatsView({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "DONE") return false;
      return new Date(t.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    }).length;

    const bySubject: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      const key = t.subject?.trim() || "ไม่ระบุวิชา";
      bySubject[key] ??= { total: 0, done: 0 };
      bySubject[key].total++;
      if (t.status === "DONE") bySubject[key].done++;
    });
    const subjects = Object.entries(bySubject).sort((a, b) => b[1].total - a[1].total);

    return { total, done, inProgress, todo, overdue, subjects };
  }, [tasks]);

  const pct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  const statusData: { key: Status; value: number; color: string }[] = [
    { key: "TODO", value: stats.todo, color: "#94a3b8" },
    { key: "IN_PROGRESS", value: stats.inProgress, color: "#f59e0b" },
    { key: "DONE", value: stats.done, color: "#22c55e" },
  ];

  const cards = [
    { label: "งานทั้งหมด", value: stats.total, accent: "text-fg" },
    { label: "เสร็จแล้ว", value: stats.done, accent: "text-emerald-500" },
    { label: "กำลังทำ", value: stats.inProgress, accent: "text-amber-500" },
    { label: "เลยกำหนด", value: stats.overdue, accent: "text-coral" },
  ];

  if (stats.total === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-line bg-surface/60 py-16 text-center text-muted">
        ยังไม่มีข้อมูลให้แสดงสถิติ — เพิ่มงานก่อนนะ
      </div>
    );
  }

  // donut chart
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-line bg-surface p-4 shadow-card">
            <p className="text-sm text-muted">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* donut สัดส่วนสถานะ */}
        <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-fg">สัดส่วนตามสถานะ</h3>
          <div className="flex items-center gap-5">
            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgb(var(--c-line))" strokeWidth="16" />
              {statusData.map((s) => {
                if (s.value === 0) return null;
                const len = (s.value / stats.total) * circ;
                const el = (
                  <circle
                    key={s.key}
                    cx="70" cy="70" r={r}
                    fill="none" stroke={s.color} strokeWidth="16"
                    strokeDasharray={`${len} ${circ - len}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return el;
              })}
            </svg>
            <div className="space-y-2">
              {statusData.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted">{STATUS_LABELS[s.key]}</span>
                  <span className="font-semibold text-fg">{s.value}</span>
                </div>
              ))}
              <div className="pt-1 text-sm">
                <span className="text-muted">ความสำเร็จ </span>
                <span className="font-bold text-brand">{pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* bar chart ตามวิชา */}
        <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-fg">งานตามวิชา</h3>
          <div className="space-y-3">
            {stats.subjects.map(([name, d]) => {
              const max = stats.subjects[0][1].total || 1;
              return (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-fg">{name}</span>
                    <span className="text-muted">{d.done}/{d.total} เสร็จ</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-bg">
                    <div className="flex h-full" style={{ width: `${(d.total / max) * 100}%` }}>
                      <div className="h-full bg-emerald-500" style={{ width: `${(d.done / d.total) * 100}%` }} />
                      <div className="h-full bg-brand/40" style={{ width: `${((d.total - d.done) / d.total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
