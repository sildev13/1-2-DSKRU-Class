"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_ORDER, Status, Task, parseTags } from "@/lib/types";
import { PRIORITY_DOT, dueInfo, formatThaiDate, subtaskProgress } from "@/lib/format";

export default function KanbanBoard({
  tasks,
  onStatusChange,
  onEdit,
}: {
  tasks: Task[];
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  const colCount = (s: Status) => tasks.filter((t) => t.status === s).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          onDragOver={(e) => {
            e.preventDefault();
            setOverCol(status);
          }}
          onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
          onDrop={() => {
            if (dragId) onStatusChange(dragId, status);
            setDragId(null);
            setOverCol(null);
          }}
          className={`rounded-xl2 border p-3 transition ${
            overCol === status ? "border-brand bg-brand-soft/50" : "border-line bg-bg/50"
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-fg">{STATUS_LABELS[status]}</h3>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-line">
              {colCount(status)}
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks
              .filter((t) => t.status === status)
              .map((task) => {
                const due = dueInfo(task.dueDate);
                const sub = subtaskProgress(task);
                const tags = parseTags(task.tags);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onEdit(task)}
                    className={`cursor-grab rounded-xl border border-line bg-surface p-3 shadow-card transition active:cursor-grabbing hover:border-brand/40 ${
                      dragId === task.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                      <p className={`text-sm font-medium leading-snug ${status === "DONE" ? "text-muted line-through" : "text-fg"}`}>
                        {task.title}
                      </p>
                    </div>

                    {(task.subject || tags.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pl-4">
                        {task.subject && (
                          <span className="rounded-md bg-bg px-1.5 py-0.5 text-[11px] text-muted">{task.subject}</span>
                        )}
                        {tags.map((t) => (
                          <span key={t} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">#{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-4 text-[11px]">
                      {due && (
                        <span className={`font-medium ${due.overdue ? "text-coral" : due.urgent ? "text-amber-600 dark:text-amber-400" : "text-muted"}`}>
                          {formatThaiDate(task.dueDate)}
                        </span>
                      )}
                      {sub.total > 0 && <span className="text-muted">✓ {sub.done}/{sub.total}</span>}
                      {task.assignee && <span className="text-muted">@{task.assignee}</span>}
                    </div>
                  </div>
                );
              })}

            {colCount(status) === 0 && (
              <p className="rounded-xl border border-dashed border-line py-6 text-center text-xs text-muted">
                ลากการ์ดมาวางที่นี่
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
