'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const QUICK_DEDUCT = [5, 10, 20];

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH');
}

export default function Home() {
  const [members, setMembers] = useState([]);
  const [log, setLog] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [flash, setFlash] = useState({}); // { [id]: '−10' }

  const load = useCallback(async () => {
    setError('');
    try {
      const [mRes, lRes, sRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/log'),
        fetch('/api/session?module=points'),
      ]);
      const m = await mRes.json();
      const l = await lRes.json();
      const s = await sRes.json();
      if (m.error) setError(m.error);
      setMembers((m.members || []).slice().sort((a, b) => b.points - a.points));
      setLog(Array.isArray(l.log) ? l.log : []);
      setIsAdmin(Boolean(s.isAdmin));
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ — ตรวจสอบการตั้งค่า Google Sheets ใน .env.local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(id, change, reason) {
    const res = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, change, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'ทำรายการไม่สำเร็จ');
      return;
    }
    setFlash((f) => ({ ...f, [id]: (change > 0 ? '+' : '−') + Math.abs(change) }));
    setTimeout(() => {
      setFlash((f) => {
        const next = { ...f };
        delete next[id];
        return next;
      });
    }, 850);
    load();
  }

  async function addMember(name, startPoints) {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startPoints }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'เพิ่มสมาชิกไม่สำเร็จ');
      return false;
    }
    load();
    return true;
  }

  async function removeMember(id, name) {
    if (!confirm(`ลบ "${name}" ออกจากกระดาน?`)) return;
    const res = await fetch(`/api/members?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'ลบไม่สำเร็จ');
      return;
    }
    load();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const maxPoints = Math.max(1, ...members.map((m) => m.points));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:pt-10">
      <Header
        isAdmin={isAdmin}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
      />

      {!loading && members.length > 0 && (
        <div className="mb-5 flex justify-center sm:justify-start">
          <button
            onClick={() => setShowSummary(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:border-crown/50 active:scale-95"
          >
            <span aria-hidden>📋</span> สรุปรายชื่อส่งครู
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-penalty/40 bg-penalty/10 px-4 py-3 text-sm text-penalty">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-muted">กำลังโหลด…</p>
      ) : members.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <section className="space-y-3">
          {members.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              rank={i + 1}
              max={maxPoints}
              isAdmin={isAdmin}
              flash={flash[m.id]}
              onAdjust={adjust}
              onDelete={removeMember}
            />
          ))}
        </section>
      )}

      {isAdmin && !loading && <AddMemberCard onAdd={addMember} />}

      {log.length > 0 && <ActivityLog log={log} />}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            load();
          }}
        />
      )}

      {showSummary && (
        <SummaryModal members={members} onClose={() => setShowSummary(false)} />
      )}
    </main>
  );
}

function Header({ isAdmin, onLoginClick, onLogout }) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 font-display text-[11px] uppercase tracking-[0.35em] text-penalty">
          Penalty Board
        </p>
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">กระดานหักคะแนน</h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin ? 'โหมดหัวหน้า — แตะเพื่อหักหรือเพิ่มแต้ม' : 'อันดับแต้มของทุกคน'}
        </p>
      </div>
      {isAdmin ? (
        <button
          onClick={onLogout}
          className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-muted transition hover:text-text"
        >
          ออกจากระบบ
        </button>
      ) : null}
    </header>
  );
}

function MemberRow({ member, rank, max, isAdmin, flash, onAdjust, onDelete }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const pct = Math.max(4, Math.round((member.points / max) * 100));
  const isLeader = rank === 1;
  const low = member.points <= 0;

  function applyCustom(sign) {
    const val = Math.abs(parseInt(amount, 10));
    if (!Number.isFinite(val) || val === 0) return;
    onAdjust(member.id, sign * val, reason);
    setAmount('');
    setReason('');
    setOpen(false);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface p-4 transition ${
        isLeader ? 'border-crown/40' : 'border-line'
      }`}
    >
      {flash && (
        <span
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 animate-stamp rounded-lg border-2 px-3 py-1 font-display text-3xl font-bold tnum ${
            flash.startsWith('+')
              ? 'border-reward text-reward'
              : 'border-penalty text-penalty'
          }`}
        >
          {flash}
        </span>
      )}

      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold tnum ${
            isLeader
              ? 'bg-crown text-black'
              : 'bg-surface-2 text-muted'
          }`}
          aria-label={`อันดับ ${rank}`}
        >
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-semibold">{member.name}</span>
            {isLeader && <span className="text-sm" aria-hidden>👑</span>}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${low ? 'bg-penalty' : isLeader ? 'bg-crown' : 'bg-reward'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`font-display text-2xl font-bold leading-none tnum ${
              low ? 'text-penalty' : 'text-text'
            }`}
          >
            {member.points}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">แต้ม</div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {QUICK_DEDUCT.map((n) => (
            <button
              key={n}
              onClick={() => onAdjust(member.id, -n, '')}
              className="rounded-lg bg-penalty/12 px-3 py-1.5 text-sm font-semibold text-penalty transition hover:bg-penalty/20 active:scale-95"
            >
              −{n}
            </button>
          ))}
          <button
            onClick={() => onAdjust(member.id, 5, '')}
            className="rounded-lg bg-reward/12 px-3 py-1.5 text-sm font-semibold text-reward transition hover:bg-reward/20 active:scale-95"
          >
            +5
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:text-text"
          >
            กำหนดเอง
          </button>
          <button
            onClick={() => onDelete(member.id, member.name)}
            className="ml-auto rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-penalty"
            aria-label={`ลบ ${member.name}`}
          >
            ลบ
          </button>
        </div>
      )}

      {isAdmin && open && (
        <div className="mt-3 animate-risein rounded-xl bg-surface-2 p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="จำนวนแต้ม"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted/60 sm:w-32"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เหตุผล (ไม่ใส่ก็ได้)"
              className="w-full flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted/60"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => applyCustom(-1)}
              className="flex-1 rounded-lg bg-penalty px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
            >
              หักแต้ม
            </button>
            <button
              onClick={() => applyCustom(1)}
              className="flex-1 rounded-lg bg-reward px-3 py-2 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95"
            >
              เพิ่มแต้ม
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberCard({ onAdd }) {
  const [name, setName] = useState('');
  const [points, setPoints] = useState('100');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(name.trim(), parseInt(points, 10) || 0);
    setBusy(false);
    if (ok) {
      setName('');
      setPoints('100');
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-line bg-surface/50 p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">เพิ่มสมาชิกใหม่</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="ชื่อเพื่อน"
          className="w-full flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted/60"
        />
        <input
          type="number"
          inputMode="numeric"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="แต้มเริ่มต้น"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted/60 sm:w-32"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-90 active:scale-95 disabled:opacity-50"
        >
          {busy ? 'กำลังเพิ่ม…' : 'เพิ่ม'}
        </button>
      </div>
    </section>
  );
}

function ActivityLog({ log }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.35em] text-muted">
        ประวัติล่าสุด
      </h2>
      <ul className="space-y-1.5">
        {log.map((e, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
          >
            <span
              className={`w-12 shrink-0 text-center font-display font-bold tnum ${
                e.change < 0 ? 'text-penalty' : 'text-reward'
              }`}
            >
              {e.change > 0 ? '+' : '−'}
              {Math.abs(e.change)}
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-medium">{e.name}</span>
              {e.reason && <span className="text-muted"> · {e.reason}</span>}
            </div>
            <span className="shrink-0 text-xs text-muted">{timeAgo(e.timestamp)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ isAdmin }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-14 text-center">
      <p className="text-base font-semibold">ยังไม่มีสมาชิกบนกระดาน</p>
      <p className="mt-1 text-sm text-muted">
        {isAdmin
          ? 'เพิ่มเพื่อนคนแรกได้จากช่องด้านล่าง'
          : 'เข้าสู่ระบบหัวหน้าเพื่อเริ่มเพิ่มสมาชิก'}
      </p>
    </div>
  );
}

function SummaryModal({ members, onClose }) {
  const taRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ranked = members.slice().sort((a, b) => b.points - a.points);
  const lines = ranked.map((m, i) => `${i + 1}. ${m.name} — ${m.points} แต้ม`);
  const text = `สรุปคะแนน ${dateStr}\n\n${lines.join('\n')}\n\nรวม ${ranked.length} คน`;

  const canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else if (taRef.current) {
        taRef.current.focus();
        taRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* คัดลอกอัตโนมัติไม่ได้ — ผู้ใช้เลือกข้อความเองได้จากกล่องด้านบน */
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
    } catch {
      /* ผู้ใช้ยกเลิก หรือเครื่องไม่รองรับการแชร์ */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-risein rounded-2xl border border-line bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-display text-[11px] uppercase tracking-[0.35em] text-crown">
          Summary
        </p>
        <h2 className="mb-1 text-lg font-bold">สรุปรายชื่อส่งครู</h2>
        <p className="mb-4 text-sm text-muted">คัดลอกหรือแชร์ข้อความนี้ส่งให้ครูได้เลย</p>

        <textarea
          ref={taRef}
          readOnly
          value={text}
          rows={Math.min(16, members.length + 5)}
          onFocus={(e) => e.target.select()}
          className="w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed outline-none"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={copy}
            className="flex-1 rounded-lg bg-crown px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95"
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกข้อความ'}
          </button>
          {canShare && (
            <button
              onClick={share}
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-text transition hover:border-crown/50 active:scale-95"
            >
              แชร์
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-text"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}

function LoginModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setErr('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      return;
    }
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-risein rounded-2xl border border-line bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-display text-[11px] uppercase tracking-[0.35em] text-penalty">
          Head Access
        </p>
        <h2 className="mb-4 text-lg font-bold">เข้าสู่ระบบหัวหน้า</h2>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="รหัสผ่าน"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm outline-none placeholder:text-muted/60"
        />
        {err && <p className="mt-2 text-sm text-penalty">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:text-text"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-lg bg-penalty px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {busy ? 'กำลังเข้า…' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </div>
    </div>
  );
}
