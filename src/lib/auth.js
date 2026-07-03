// ระบบล็อกอินรายคน + สิทธิ์ (เก็บใน Neon)
import crypto from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
export const SESSION_COOKIE = 'session';

// ระบบทั้งหมดที่กำหนดสิทธิ์ได้
export const MODULES = ['points', 'attendance', 'money', 'duty', 'vote', 'board', 'schedule'];

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
export function verifyPassword(plain, hash) {
  try { return bcrypt.compareSync(plain, hash); } catch { return false; }
}

// เซ็น userId เป็น token ปลอมไม่ได้
function sign(userId) {
  return crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
}
export function makeSessionValue(userId) {
  return `${userId}.${sign(userId)}`;
}
function parseSession(value) {
  if (!value) return null;
  const i = value.lastIndexOf('.');
  if (i < 0) return null;
  const userId = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = sign(userId);
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return userId;
  } catch {}
  return null;
}

// ผู้ใช้ปัจจุบัน (อ่านจาก cookie -> ดึงจาก DB)
export async function getCurrentUser() {
  const store = await cookies();
  const userId = parseSession(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return { id: u.id, username: u.username, name: u.name, isHead: u.isHead, perms: u.perms || [] };
}

// ตรวจสิทธิ์แก้ระบบ
export async function canEdit(moduleKey) {
  const u = await getCurrentUser();
  if (!u) return false;
  return u.isHead || (u.perms || []).includes(moduleKey);
}
export async function isHead() {
  const u = await getCurrentUser();
  return !!(u && u.isHead);
}
