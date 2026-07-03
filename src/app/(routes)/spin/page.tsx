"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Member { id: string; name: string; points: number; }
interface WinEntry { timestamp: string; name: string; }

const COLORS = ["#6f8cff", "#f4827f", "#38d39a", "#ffc857", "#a78bfa", "#f472b6", "#38bdf8", "#fb923c"];
const MIN_POINTS = 100;
const SPIN_MS = 4200;

export default function SpinPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [wins, setWins] = useState<WinEntry[]>([]);
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
      const [mRes, sRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/session?module=points"),
      ]);
      const m = await mRes.json();
      const s = await sRes.json();
      if (m.error) setError(m.error);
      setMembers(m.members || []);
      setIsAdmin(Boolean(s.isAdmin));
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const eligible = useMemo(() => members.filter((m) => m.points >= MIN_POINTS), [members]);

  const seg = eligible.length > 0 ? 360 / eligible.length : 0;
  const gradient = useMemo(() => {
    if (eligible.length === 0) return "none";
    const stops = eligible.map((_, i) => `${COLORS[i % COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`);
    return `conic-gradient(${stops.join(",")})`;
  }, [eligible, seg]);

  function spin() {
    if (spinning || eligible.length < 2 || !isAdmin) return;
    setError("");
    setResult(null);
    const winnerIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[winnerIndex];
    const targetCenter = (winnerIndex + 0.5) * seg;
    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (360 - targetCenter + 360) % 360;
    const delta = (desiredMod - currentMod + 360) % 360;
    const extraSpins = 6;
    pendingWinner.current = winner;
    setSpinning(true);
    setRotation((r) => r + delta + extraSpins * 360);
  }

  function onTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform" || !spinning) return;
    const winner = pendingWinner.current;
    pendingWinner.current = null;
    setSpinning(false);
    if (!winner) return;
    setResult({ name: winner.name, points: winner.points });
    setWins((prev) => [{ timestamp: new Date().toISOString(), name: winner.name }, ...prev].slice(0, 10));
  }

  return (
    <div className="aura-scope mx-auto max-w-2xl px-2 pb-28 pt-4">
      <header className="mb-5">
        <p className="text-sm font-medium text-brand">ห้อง 1/2 · เกม</p>
        <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">วงล้อสุ่มแจกรางวัล</h1>
        <p className="mt-1 text-sm text-muted">หมุนแล้วคนที่ถูกสุ่มจะได้รับรางวัล (ต้องมีแต้มถึง {MIN_POINTS} ถึงจะเข้าวงล้อได้)</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      {loading ? (
        <div className="mx-auto aspect-square w-full max-w-sm animate-pulse rounded-full border border-line bg-surface" />
      ) : eligible.length < 2 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          ต้องมีสมาชิกที่แต้มถึง {MIN_POINTS} อย่างน้อย 2 คนก่อนถึงจะหมุนได้
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
            <div className="mt-6 animate-risein rounded-xl2 border border-brand/40 bg-brand/10 p-4 text-center">
              <p className="text-sm text-muted">ผลการหมุน 🎉</p>
              <p className="mt-1 text-xl font-bold text-fg">{result.name}</p>
              <p className="mt-1 text-sm text-brand">รับรางวัลจากพี่หัวหน้าห้องได้เลย (Robux / คูปอง / เพชร / เงิน)</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {eligible.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 truncate font-medium text-fg">{m.name}</span>
                <span className="tnum shrink-0 text-muted">{m.points}</span>
              </div>
            ))}
          </div>

          {members.length > eligible.length && (
            <p className="mt-3 text-center text-xs text-muted">
              สมาชิกที่แต้มต่ำกว่า {MIN_POINTS} จะไม่ถูกรวมในวงล้อ
            </p>
          )}
        </>
      )}

      {wins.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">ผู้โชคดีล่าสุด</h2>
          <ul className="space-y-1.5">
            {wins.map((w, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
                <span className="font-medium text-fg">{w.name}</span>
                <span className="text-muted">{new Date(w.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
