"use client";

import { useEffect, useState } from "react";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  Task,
} from "@/lib/types";
import { toDateInput } from "@/lib/format";

export interface TaskInput {
  title: string;
  description: string;
  subject: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  link: string;
  tags: string;
  subtasks: string[];
}

const empty: TaskInput = {
  title: "",
  description: "",
  subject: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assignee: "",
  link: "",
  tags: "",
  subtasks: [],
};

export default function TaskForm({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Task | null;
  onClose: () => void;
  onSubmit: (data: TaskInput) => Promise<void>;
}) {
  const [form, setForm] = useState<TaskInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? "",
        subject: editing.subject ?? "",
        status: editing.status,
        priority: editing.priority,
        dueDate: toDateInput(editing.dueDate),
        assignee: editing.assignee ?? "",
        link: editing.link ?? "",
        tags: editing.tags ?? "",
        subtasks: [],
      });
    } else {
      setForm(empty);
    }
    setError("");
    setNewSub("");
  }, [editing, open]);

  if (!open) return null;

  const update = (key: keyof TaskInput, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function addSub() {
    const t = newSub.trim();
    if (!t) return;
    setForm((f) => ({ ...f, subtasks: [...f.subtasks, t] }));
    setNewSub("");
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("กรุณาใส่ชื่องาน");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch {
      setError("บันทึกไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 placeholder:text-muted/60";
  const label = "mb-1.5 block text-sm font-medium text-fg/80";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl2 bg-surface p-6 shadow-card sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">
            {editing ? "แก้ไขงาน" : "เพิ่มงานใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-bg hover:text-fg"
            aria-label="ปิด"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label}>ชื่องาน *</label>
            <input
              className={field}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="เช่น ทำรายงานวิทยาศาสตร์ บทที่ 3"
              autoFocus
            />
          </div>

          <div>
            <label className={label}>รายละเอียด</label>
            <textarea
              className={field + " min-h-[72px] resize-y"}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="โน้ตเพิ่มเติม..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>วิชา</label>
              <input className={field} value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="เช่น คณิตศาสตร์" />
            </div>
            <div>
              <label className={label}>มอบหมายให้</label>
              <input className={field} value={form.assignee} onChange={(e) => update("assignee", e.target.value)} placeholder="ชื่อเพื่อน / ตัวเอง" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>วันครบกำหนด</label>
              <input type="date" className={field} value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
            </div>
            <div>
              <label className={label}>ความสำคัญ</label>
              <select className={field} value={form.priority} onChange={(e) => update("priority", e.target.value)}>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>ลิงก์ส่งงาน</label>
              <input className={field} value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="วางลิงก์ Drive/Docs" />
            </div>
            <div>
              <label className={label}>แท็ก (คั่นด้วย ,)</label>
              <input className={field} value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="สอบ, กลุ่ม" />
            </div>
          </div>

          <div>
            <label className={label}>สถานะ</label>
            <div className="flex gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update("status", s)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    form.status === s
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-surface text-muted hover:border-brand/40"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {!editing && (
            <div>
              <label className={label}>งานย่อย / เช็คลิสต์</label>
              {form.subtasks.length > 0 && (
                <ul className="mb-2 space-y-1.5">
                  {form.subtasks.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-bg px-3 py-1.5 text-sm text-fg">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => update("subtasks", form.subtasks.filter((_, j) => j !== i))}
                        className="text-muted hover:text-coral"
                        aria-label="ลบงานย่อย"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  className={field}
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSub();
                    }
                  }}
                  placeholder="พิมพ์แล้วกด Enter เพื่อเพิ่ม"
                />
                <button
                  type="button"
                  onClick={addSub}
                  className="shrink-0 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-brand transition hover:bg-brand-soft"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-coral">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg/70 transition hover:bg-bg">
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
