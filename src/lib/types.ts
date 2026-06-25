export type Status = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type ViewMode = "list" | "kanban" | "calendar" | "stats";
export type SortKey = "created" | "due" | "priority" | "title";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  assignee: string | null;
  link: string | null;
  tags: string | null;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<Status, string> = {
  TODO: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังทำ",
  DONE: "เสร็จแล้ว",
};

export const STATUS_ORDER: Status[] = ["TODO", "IN_PROGRESS", "DONE"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
};

export const PRIORITY_ORDER: Priority[] = ["HIGH", "MEDIUM", "LOW"];
export const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export const SORT_LABELS: Record<SortKey, string> = {
  created: "ล่าสุด",
  due: "ใกล้ครบกำหนด",
  priority: "ความสำคัญ",
  title: "ชื่อ ก-ฮ",
};

// แปลง tags (string คั่นจุลภาค) เป็น array
export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
