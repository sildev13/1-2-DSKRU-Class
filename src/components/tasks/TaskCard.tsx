"use client";

import { useState } from "react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  Status,
  Task,
  parseTags,
} from "@/lib/types";
import {
  PRIORITY_DOT,
  STATUS_STYLE,
  dueInfo,
  formatThaiDate,
  subtaskProgress,
} from "@/lib/format";

export interface TaskCardHandlers {
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onSubtaskToggle: (subtaskId: string, done: boolean) => void;
  onSubtaskAdd: (taskId: string, title: string) => void;
  onSubtaskDelete: (subtaskId: string) => void;
}

export default function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onSubtaskToggle,
  onSubtaskAdd,
  onSubtaskDelete,
}: { task: Task } & TaskCardHandlers) {
  const [open, setOpen] = useState(false);
  const [newSub, setNewSub] = useState("");
  const due = dueInfo(task.dueDate);
  const isDone = task.status === "DONE";
  const tags = parseTags(task.tags);
  const sub = subtaskProgress(task);

  const idx = STATUS_ORDER.indexOf(task.status);
  const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];

  function submitSub() {
    const t = newSub.trim();
    if (!t) return;
    onSubtaskAdd(task.id, t);
    setNewSub("");
  }

  return (
    <div className="group rounded-xl2 border border-line bg-surface p-4 shadow-card transition hover:border-brand/30">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(task.id, isDone ? "TODO" : "DONE")}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted/50 hover:border-brand"
          }`}
          aria-label={isDone ? "ทำเครื่องหมายยังไม่เสร็จ" : "ทำเครื่องหมายเสร็จ"}
        >
          {isDone && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium leading-snug ${isDone ? "text-muted line-through" : "text-fg"}`}>
              {task.title}
            </h3>
            <span className="flex shrink-0 items-center gap-1" title={`ความสำคัญ: ${PRIORITY_LABELS[task.priority]}`}>
              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
            </span>
          </div>

          {task.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>}

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${STATUS_STYLE[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>

            {task.subject && (
              <span className="inline-flex items-center gap-1 text-muted">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5a2 2 0 012-2h11a1 1 0 011 1v15a1 1 0 01-1 1H6a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                {task.subject}
              </span>
            )}

            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-muted">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {task.assignee}
              </span>
            )}

            {due && (
              <span className={`inline-flex items-center gap-1 font-medium ${due.overdue ? "text-coral" : due.urgent ? "text-amber-600 dark:text-amber-400" : "text-muted"}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3.5 9h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {formatThaiDate(task.dueDate)} · {due.text}
              </span>
            )}

            {task.link && (
              <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1.5 1.5M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                ลิงก์ส่งงาน
              </a>
            )}

            {sub.total > 0 && (
              <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 font-medium text-muted hover:text-fg">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {sub.done}/{sub.total}
                <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
              </button>
            )}
          </div>

          {/* progress bar ของงานย่อย */}
          {sub.total > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(sub.done / sub.total) * 100}%` }} />
            </div>
          )}

          {/* รายการงานย่อย (กางออก) */}
          {open && (
            <div className="mt-3 space-y-1.5 rounded-xl bg-bg p-2.5">
              {task.subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => onSubtaskToggle(st.id, !st.done)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className={`flex-1 ${st.done ? "text-muted line-through" : "text-fg"}`}>{st.title}</span>
                  <button onClick={() => onSubtaskDelete(st.id)} className="text-muted hover:text-coral" aria-label="ลบงานย่อย">✕</button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitSub(); } }}
                  placeholder="เพิ่มงานย่อย..."
                  className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-brand"
                />
                <button onClick={submitSub} className="rounded-lg bg-brand-soft px-2.5 text-sm font-medium text-brand">เพิ่ม</button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {!isDone && (
              <button onClick={() => onStatusChange(task.id, next)} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand transition hover:bg-brand/20">
                เลื่อนเป็น “{STATUS_LABELS[next]}”
              </button>
            )}
            {sub.total === 0 && (
              <button onClick={() => setOpen((o) => !o)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-bg hover:text-fg">
                + งานย่อย
              </button>
            )}
            <button onClick={() => onEdit(task)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-bg hover:text-fg">
              แก้ไข
            </button>
            <button onClick={() => onDelete(task.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-coral/10 hover:text-coral">
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
