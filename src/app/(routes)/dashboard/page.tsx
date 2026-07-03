import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const DAY_TH: Record<string, string> = { MON: "จันทร์", TUE: "อังคาร", WED: "พุธ", THU: "พฤหัสบดี", FRI: "ศุกร์", SAT: "เสาร์", SUN: "อาทิตย์" };

function fmtDue(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

const Card = ({ title, href, children }: { title: string; href: string; children: React.ReactNode }) => (
  <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold text-fg">{title}</h2>
      <Link href={href} className="text-xs text-brand hover:underline">ดูทั้งหมด →</Link>
    </div>
    {children}
  </div>
);

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try {
    data = await getDashboardData();
  } catch (e) {
    console.error("dashboard page", e);
  }

  if (!data) {
    return <div className="aura-scope mx-auto max-w-md px-2 pt-16 text-center"><p className="rounded-xl2 border border-coral/30 bg-coral/5 p-8 text-coral">โหลดข้อมูลไม่สำเร็จ</p></div>;
  }

  return (
    <div className="aura-scope mx-auto max-w-4xl px-2 pb-28 pt-5">
      <header className="mb-6">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 DSKRU</p>
        <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">สวัสดี{data.user?.name ? ` ${data.user.name}` : ""} 👋</h1>
        <p className="mt-1 text-sm text-muted">ภาพรวมของห้องวันนี้</p>
      </header>

      {/* การ์ดสรุปตัวเลข */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Link href="/tasks" className="rounded-xl2 border border-line bg-surface p-4 text-center shadow-card transition hover:border-brand/40">
          <p className="text-3xl font-bold text-brand">{data.tasks.notDone}</p>
          <p className="text-xs text-muted">งานที่ยังไม่เสร็จ</p>
        </Link>
        <Link href="/attendance" className="rounded-xl2 border border-line bg-surface p-4 text-center shadow-card transition hover:border-brand/40">
          <p className="text-3xl font-bold text-emerald-400">{data.tasks.done}</p>
          <p className="text-xs text-muted">งานเสร็จแล้ว</p>
        </Link>
        <Link href="/money" className="rounded-xl2 border border-line bg-surface p-4 text-center shadow-card transition hover:border-brand/40">
          <p className="text-3xl font-bold text-amber-400">{data.money.length}</p>
          <p className="text-xs text-muted">รายการเงินค้าง</p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* งานใกล้ครบกำหนด */}
        <Card title="📋 งานใกล้ครบกำหนด" href="/tasks">
          {data.tasks.upcoming.length === 0 ? <p className="text-sm text-muted">ไม่มีงานที่มีกำหนดส่ง 🎉</p> :
            <ul className="space-y-2">
              {data.tasks.upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${t.overdue ? "bg-coral" : t.soon ? "bg-amber-400" : "bg-brand"}`} />
                  <span className="flex-1 truncate text-fg">{t.title}{t.subject && <span className="text-muted"> · {t.subject}</span>}</span>
                  <span className={`shrink-0 text-xs ${t.overdue ? "text-coral" : "text-muted"}`}>{t.overdue ? "เลยกำหนด" : fmtDue(t.dueDate as unknown as string)}</span>
                </li>
              ))}
            </ul>}
        </Card>

        {/* เวรวันนี้ */}
        <Card title="🧹 เวรวันนี้" href="/duty">
          <p className="mb-2 text-xs text-muted">วัน{DAY_TH[data.dutyToday.day]}</p>
          {data.dutyToday.isWeekend ? <p className="text-sm text-muted">วันหยุด ไม่มีเวร 😌</p> :
            data.dutyToday.names.length === 0 ? <p className="text-sm text-muted">ยังไม่ได้กำหนดเวรวันนี้</p> :
            <div className="flex flex-wrap gap-1.5">{data.dutyToday.names.map((n, i) => <span key={i} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs text-fg">{n}</span>)}</div>}
        </Card>

        {/* ประกาศล่าสุด */}
        <Card title="📢 ประกาศล่าสุด" href="/board">
          {data.announcements.length === 0 ? <p className="text-sm text-muted">ยังไม่มีประกาศ</p> :
            <ul className="space-y-2">
              {data.announcements.map((a) => (
                <li key={a.id} className="border-l-2 border-brand/40 pl-2.5">
                  <p className="truncate text-sm font-medium text-fg">{a.pinned && "📌 "}{a.title}</p>
                  <p className="truncate text-xs text-muted">{a.body}</p>
                </li>
              ))}
            </ul>}
        </Card>

        {/* เงินค้าง + อันดับคะแนน */}
        <Card title="💰 เก็บเงินค้าง" href="/money">
          {data.money.length === 0 ? <p className="text-sm text-muted">เก็บครบทุกรายการ 🎉</p> :
            <ul className="space-y-2">
              {data.money.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-fg">{m.title}</span>
                  <span className="shrink-0 text-xs text-amber-400">ค้าง {m.remaining} คน · {m.outstanding.toLocaleString()}฿</span>
                </li>
              ))}
            </ul>}
        </Card>
      </div>

      {/* อันดับคะแนน top 3 */}
      {data.topStudents.length > 0 && (
        <div className="mt-4">
          <Card title="⚖️ อันดับคะแนนสูงสุด" href="/points">
            <div className="grid grid-cols-3 gap-3">
              {data.topStudents.map((s, i) => (
                <div key={i} className="rounded-xl border border-line bg-bg/40 p-3 text-center">
                  <div className="text-xl">{["🥇","🥈","🥉"][i]}</div>
                  <p className="truncate text-sm font-medium text-fg">{s.name}</p>
                  <p className="text-lg font-bold text-brand">{s.points}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
