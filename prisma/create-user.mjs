// สร้างผู้ใช้ใหม่ (รันครั้งแรกเพื่อสร้างหัวหน้า)
// วิธีใช้:  node prisma/create-user.mjs <username> <password> [ชื่อ] [--head]
// ตัวอย่าง: node prisma/create-user.mjs 69110 31102013 "หัวหน้า" --head
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

// โหลด DATABASE_URL จาก .env
try {
  const txt = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { console.error('อ่าน .env ไม่ได้'); }

const [username, password, name] = process.argv.slice(2);
const isHead = process.argv.includes('--head');
if (!username || !password) {
  console.log('วิธีใช้: node prisma/create-user.mjs <username> <password> [ชื่อ] [--head]');
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
try {
  const u = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: bcrypt.hashSync(password, 10), name: name || null, isHead },
    create: { username, passwordHash: bcrypt.hashSync(password, 10), name: name || null, isHead, perms: [] },
  });
  console.log(`✅ สร้าง/อัปเดตผู้ใช้: ${u.username} ${u.isHead ? '(หัวหน้า)' : ''}`);
} catch (e) {
  console.error('❌', e.message);
} finally {
  await prisma.$disconnect();
}
