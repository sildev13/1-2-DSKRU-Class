"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRIORITY_RANK,
  SORT_LABELS,
  STATUS_LABELS,
  SortKey,
  Status,
  Subtask,
  Task,
  ViewMode,
} from "@/lib/types";
import { collectTags } from "@/lib/format";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm, { TaskInput } from "@/components/tasks/TaskForm";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import CalendarView from "@/components/tasks/CalendarView";
import StatsView from "@/components/tasks/StatsView";

type StatusFilter = "ALL" | Status;

const VIEWS: { key: ViewMode; label: string; icon: string }[] = [
  { key: "list", label: "รายการ", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "kanban", label: "บอร์ด", icon: "M4 5h5v14H4zM10 5h4v9h-4zM15 5h5v6h-5z" },
  { key: "calendar", label: "ปฏิทิน", icon: "M3 8h18M7 3v4M17 3v4M4 5h16v15H4z" },
  { key: "stats", label: "สถิติ", icon: "M5 20V10M12 20V4M19 20v-7" },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  async function load() {
    try {
      setLoadError("");
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      setLoadError("โหลดข้อมูลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูล");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.subject && set.add(t.subject));
    return Array.from(set).sort();
  }, [tasks]);

  const allTags = useMemo(() => collectTags(tasks), [tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    todo: tasks.filter((t) => t.status === "TODO").length,
  }), [tasks]);

  // กรองด้วยค้นหา/วิชา/แท็ก (ใช้ร่วมทุกมุมมอง)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (subjectFilter !== "ALL" && t.subject !== subjectFilter) return false;
      if (tagFilter !== "ALL") {
        const tags = (t.tags ?? "").split(",").map((x) => x.trim());
        if (!tags.includes(tagFilter)) return false;
      }
      if (q) {
        const hay = `${t.title} ${t.description ?? ""} ${t.subject ?? ""} ${t.assignee ?? ""} ${t.tags ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, query, subjectFilter, tagFilter]);

  // สำหรับมุมมองรายการ: กรองสถานะ + เรียงลำดับ
  const listTasks = useMemo(() => {
    let arr = filtered.filter((t) => statusFilter === "ALL" || t.status === statusFilter);
    arr = [...arr].sort((a, b) => {
      switch (sortKey) {
        case "due":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "title":
          return a.title.localeCompare(b.title, "th");
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return arr;
  }, [filtered, statusFilter, sortKey]);

  // ---------- CRUD ----------
  async function handleSubmit(data: TaskInput) {
    const payload = { ...data, dueDate: data.dueDate || null };
    if (editing) {
      const res = await fetch(`/api/tasks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const created: Task = await res.json();
      setTasks((p) => [created, ...p]);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleStatusChange(id: string, status: Status) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบงานนี้ใช่ไหม?")) return;
    setTasks((p) => p.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  // ---------- งานย่อย ----------
  async function handleSubtaskToggle(subtaskId: string, done: boolean) {
    setTasks((p) =>
      p.map((t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done } : s)) }))
    );
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  async function handleSubtaskAdd(taskId: string, title: string) {
    const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    const sub: Subtask = await res.json();
    setTasks((p) => p.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t)));
  }

  async function handleSubtaskDelete(subtaskId: string) {
    setTasks((p) => p.map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) })));
    await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
  }

  const handlers = {
    onStatusChange: handleStatusChange,
    onEdit: (t: Task) => { setEditing(t); setFormOpen(true); },
    onDelete: handleDelete,
    onSubtaskToggle: handleSubtaskToggle,
    onSubtaskAdd: handleSubtaskAdd,
    onSubtaskDelete: handleSubtaskDelete,
  };

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "ทั้งหมด", count: stats.total },
    { key: "TODO", label: STATUS_LABELS.TODO, count: stats.todo },
    { key: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS, count: stats.inProgress },
    { key: "DONE", label: STATUS_LABELS.DONE, count: stats.done },
  ];

  return (
    <div id="tasks-module" className="mx-auto max-w-5xl px-2 pb-28 pt-4">
      <header className="mb-6">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · ติดตามงาน</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">งานของห้อง</h1>
      </header>

      {/* view switcher */}
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === v.key ? "bg-brand text-white" : "text-muted hover:text-fg"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d={v.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* search + filters */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหางาน วิชา แท็ก หรือชื่อคน..."
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-fg outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subjects.length > 0 && (
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg outline-none focus:border-brand">
              <option value="ALL">ทุกวิชา</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {allTags.length > 0 && (
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg outline-none focus:border-brand">
              <option value="ALL">ทุกแท็ก</option>
              {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
            </select>
          )}
          {view === "list" && (
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="ml-auto rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg outline-none focus:border-brand">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>เรียง: {SORT_LABELS[k]}</option>)}
            </select>
          )}
        </div>

        {view === "list" && (
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  statusFilter === tab.key ? "bg-fg text-bg" : "bg-surface text-muted ring-1 ring-line hover:text-fg"
                }`}
              >
                {tab.label}<span className="ml-1.5 opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* content */}
      <section>
        {loading ? (
          <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl2 border border-line bg-surface" />)}</div>
        ) : loadError ? (
          <div className="rounded-xl2 border border-coral/30 bg-coral/5 p-6 text-center">
            <p className="font-medium text-coral">{loadError}</p>
            <button onClick={load} className="mt-3 rounded-xl border border-coral/40 px-4 py-2 text-sm font-medium text-coral transition hover:bg-coral/10">ลองอีกครั้ง</button>
          </div>
        ) : view === "stats" ? (
          <StatsView tasks={filtered} />
        ) : view === "calendar" ? (
          <CalendarView tasks={filtered} onEdit={handlers.onEdit} />
        ) : view === "kanban" ? (
          <KanbanBoard tasks={filtered} onStatusChange={handleStatusChange} onEdit={handlers.onEdit} />
        ) : listTasks.length === 0 ? (
          <EmptyState hasAny={tasks.length > 0} onAdd={() => { setEditing(null); setFormOpen(true); }} />
        ) : (
          <div className="space-y-3">
            {listTasks.map((task) => <TaskCard key={task.id} task={task} {...handlers} />)}
          </div>
        )}
      </section>

      <button
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        เพิ่มงาน
      </button>

      <TaskForm
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function EmptyState({ hasAny, onAdd }: { hasAny: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-xl2 border border-dashed border-line bg-surface/60 py-16 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <p className="font-medium text-fg">{hasAny ? "ไม่พบงานที่ตรงกับตัวกรอง" : "ยังไม่มีงาน"}</p>
      <p className="mt-1 text-sm text-muted">{hasAny ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มต้นด้วยการเพิ่มการบ้านชิ้นแรก"}</p>
      {!hasAny && <button onClick={onAdd} className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">เพิ่มงานแรก</button>}
    </div>
  );
}
