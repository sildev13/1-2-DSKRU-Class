"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Member { id: string; name: string; points: number; }
interface LogEntry { timestamp: string; name: string; change: number; reason: string; newTotal: number; }

const COLORS = ["#6f8cff", "#f4827f", "#38d39a", "#ffc857", "#a78bfa", "#f472b6", "#38bdf8", "#fb923c"];
const DEDUCT_AMOUNT = 5;
const SPIN_REASON = "หมุนวงล้อ";
const SPIN_MS = 4200;

export default function SpinPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ name: string; points: number } | null>(null);
  const pendingWinner = useRef<Member | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [mRes, sRes, lRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/session?module=points"),
        fetch("/api/log"),
      ]);
      const m = await mRes.json();
      const s = await sRes.json();
      const l = await lRes.json();
      if (m.error) setError(m.error);
      setMembers(m.members || []);
      setIsAdmin(Boolean(s.isAdmin));
      setLog(Array.isArray(l.log) ? l.log.filter((e: LogEntry) => e.reason === SPIN_REASON) : []);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seg = members.length > 0 ? 360 / members.length : 0;
  const gradient = useMemo(() => {
    if (members.length === 0) return "none";
    const stops = members.map((_, i) => `${COLORS[i % COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`);
    return `conic-gradient(${stops.join(",")})`;
  }, [members, seg]);

  function spin() {
    if (spinning || members.length < 2 || !isAdmin) return;
    setError("");
    setResult(null);
    const winnerIndex = Math.floor(Math.random() * members.length);
    const winner = members[winnerIndex];
    const targetCenter = (winnerIndex + 0.5) * seg;
    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (360 - targetCenter + 360) % 360;
    const delta = (desiredMod - currentMod + 360) % 360;
    const extraSpins = 6;
    pendingWinner.current = winner;
    setSpinning(true);
    setRotation((r) => r + delta + extraSpins * 360);
  }

  async function onTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform" || !spinning) return;
    const winner = pendingWinner.current;
    pendingWinner.current = null;
    if (!winner) { setSpinning(false); return; }
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: winner.id, change: -DEDUCT_AMOUNT, reason: SPIN_REASON }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "หักแต้มไม่สำเร็จ");
      } else {
        setResult({ name: data.member.name, points: data.member.points });
        setMembers((prev) => prev.map((m) => (m.id === data.member.id ? { ...m, points: data.member.points } : m)));
        setLog((prev) => [
          { timestamp: new Date().toISOString(), name: data.member.name, change: -DEDUCT_AMOUNT, reason: SPIN_REASON, newTotal: data.member.points },
          ...prev,
        ].slice(0, 10));
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · เกม</p>
        <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">วงล้อสุ่มหักแต้ม</h1>
        <p className="mt-1 text-sm text-muted">หมุนแล้วคนที่ถูกสุ่มจะโดนหัก {DEDUCT_AMOUNT} แต้มทันที</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      {loading ? (
        <div className="mx-auto aspect-square w-full max-w-sm animate-pulse rounded-full border border-line bg-surface" />
      ) : members.length < 2 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          ต้องมีสมาชิกอย่างน้อย 2 คนในกระดานคะแนนก่อนถึงจะหมุนได้
        </div>
      ) : (
        <>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/3">
              <div className="h-0 w-0 border-x-[14px] border-t-[22px] border-x-transparent border-t-coral drop-shadow" />
            </div>
            <div
              className="aspect-square w-full overflow-hidden rounded-full border-4 border-surface shadow-card"
              style={{
                background: gradient,
                transform: `rotate(${rotation}deg)`,
                transition: `transform ${SPIN_MS}ms cubic-bezier(0.17,0.67,0.14,1)`,
              }}
              onTransitionEnd={onTransitionEnd}
            />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface bg-fg" />
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={spin}
              disabled={spinning || !isAdmin}
              className="rounded-full bg-brand px-8 py-3 text-base font-semibold text-white shadow-card transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
            >
              {spinning ? "กำลังหมุน…" : "หมุนวงล้อ"}
            </button>
          </div>

          {!isAdmin && (
            <p className="mt-3 text-center text-xs text-muted">
              โหมดดูอย่างเดียว — เข้าระบบหัวหน้าที่หน้ากระดานคะแนนเพื่อหมุน
            </p>
          )}

          {result && (
            <div className="mt-6 animate-risein rounded-xl2 border border-coral/40 bg-coral/10 p-4 text-center">
              <p className="text-sm text-muted">ผลการหมุน</p>
              <p className="mt-1 text-xl font-bold text-fg">{result.name}</p>
              <p className="mt-1 text-sm text-coral">โดนหัก {DEDUCT_AMOUNT} แต้ม → เหลือ {result.points} แต้ม</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 truncate font-medium text-fg">{m.name}</span>
                <span className="tnum shrink-0 text-muted">{m.points}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {log.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">ประวัติการหมุนล่าสุด</h2>
          <ul className="space-y-1.5">
            {log.map((e, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
                <span className="font-medium text-fg">{e.name}</span>
                <span className="text-coral">-{Math.abs(e.change)} แต้ม → {e.newTotal}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
