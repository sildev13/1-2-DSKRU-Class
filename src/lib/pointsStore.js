// หลังบ้านของกระดานหักคะแนน — เก็บใน Neon (Prisma)
// ชื่อฟังก์ชัน/รูปแบบข้อมูลเหมือนเวอร์ชัน Google Sheets เดิม เพื่อให้ UI ใช้ได้โดยไม่ต้องแก้
import { prisma } from '@/lib/prisma';

// ดึงรายชื่อทั้งหมด (เรียงแต้มมาก -> น้อย)
export async function getMembers() {
  const students = await prisma.student.findMany({
    orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
  });
  return students.map((s) => ({ id: s.id, name: s.name, points: s.points }));
}

// เพิ่มสมาชิก
export async function addMember(name, startPoints) {
  const pts = Number.isFinite(Number(startPoints)) ? Number(startPoints) : 100;
  const s = await prisma.student.create({ data: { name, points: pts } });
  return { id: s.id, name: s.name, points: s.points };
}

// ลบสมาชิก
export async function deleteMember(id) {
  await prisma.student.delete({ where: { id } });
  return { ok: true };
}

// ปรับแต้ม (+เพิ่ม / -หัก) แล้วบันทึก Log (atomic)
export async function adjustPoints(id, change, reason) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new Error('ไม่พบสมาชิกคนนี้');
  const newTotal = student.points + change;
  const [updated] = await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { points: newTotal } }),
    prisma.pointLog.create({
      data: { studentId: id, delta: change, reason: reason || null, newTotal },
    }),
  ]);
  return { id: updated.id, name: updated.name, points: updated.points };
}

// ดึงประวัติล่าสุด (ใหม่สุดอยู่บน) รูปแบบเหมือนเดิม
export async function getLog(limit = 30) {
  const logs = await prisma.pointLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { student: { select: { name: true } } },
  });
  return logs.map((l) => ({
    timestamp: l.createdAt.toISOString(),
    name: l.student?.name || '',
    change: l.delta,
    reason: l.reason || '',
    newTotal: l.newTotal,
  }));
}
