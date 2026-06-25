import { Priority, Status, Task } from "./types";

export function formatThaiDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function dueInfo(iso: string | null): {
  text: string;
  urgent: boolean;
  overdue: boolean;
} | null {
  if (!iso) return null;
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0)
    return { text: `เลยกำหนด ${Math.abs(diff)} วัน`, urgent: true, overdue: true };
  if (diff === 0) return { text: "ครบกำหนดวันนี้", urgent: true, overdue: false };
  if (diff === 1) return { text: "ครบกำหนดพรุ่งนี้", urgent: true, overdue: false };
  if (diff <= 3) return { text: `อีก ${diff} วัน`, urgent: true, overdue: false };
  return { text: `อีก ${diff} วัน`, urgent: false, overdue: false };
}

// สีของสถานะ (รองรับโหมดมืดด้วย dark: variant)
export const STATUS_STYLE: Record<Status, string> = {
  TODO: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600",
  IN_PROGRESS:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-500/30",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-500/30",
};

export const PRIORITY_DOT: Record<Priority, string> = {
  LOW: "bg-slate-300 dark:bg-slate-500",
  MEDIUM: "bg-brand",
  HIGH: "bg-coral",
};

// ความคืบหน้าของงานย่อย
export function subtaskProgress(task: Task): { done: number; total: number } {
  const total = task.subtasks?.length ?? 0;
  const done = task.subtasks?.filter((s) => s.done).length ?? 0;
  return { done, total };
}

// รวมแท็กทั้งหมดที่มีในระบบ
export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  tasks.forEach((t) =>
    (t.tags ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => set.add(x))
  );
  return Array.from(set).sort();
}
