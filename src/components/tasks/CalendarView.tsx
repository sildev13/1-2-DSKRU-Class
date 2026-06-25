"use client";

import { useMemo, useState } from "react";
import { Task } from "@/lib/types";
import { PRIORITY_DOT } from "@/lib/format";

const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const TH_DOW = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarView({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // จัดกลุ่มงานตามวันครบกำหนด (key = YYYY-MM-DD)
  const byDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = ymd(new Date(t.dueDate));
      (map[key] ??= []).push(t);
    });
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymd(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const noDue = tasks.filter((t) => !t.dueDate);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-fg">
          {TH_MONTHS[month]} {year + 543}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:text-fg">‹</button>
          <button onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); }} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:text-fg">วันนี้</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:text-fg">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {TH_DOW.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-muted">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = ymd(new Date(year, month, day));
          const dayTasks = byDay[key] ?? [];
          const isToday = key === todayKey;
          return (
            <div key={i} className={`min-h-[78px] rounded-xl border p-1.5 ${isToday ? "border-brand bg-brand-soft/40" : "border-line bg-surface"}`}>
              <div className={`mb-1 text-right text-xs font-medium ${isToday ? "text-brand" : "text-muted"}`}>{day}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    title={t.title}
                    className={`flex w-full items-center gap-1 truncate rounded-md px-1 py-0.5 text-left text-[11px] ${t.status === "DONE" ? "text-muted line-through" : "text-fg"} hover:bg-bg`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && <p className="px-1 text-[11px] text-muted">+{dayTasks.length - 3} อื่นๆ</p>}
              </div>
            </div>
          );
        })}
      </div>

      {noDue.length > 0 && (
        <div className="mt-5 rounded-xl2 border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-muted">ยังไม่ระบุวันครบกำหนด ({noDue.length})</p>
          <div className="flex flex-wrap gap-2">
            {noDue.map((t) => (
              <button key={t.id} onClick={() => onEdit(t)} className="rounded-lg bg-bg px-2.5 py-1 text-xs text-fg transition hover:bg-brand-soft hover:text-brand">
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
