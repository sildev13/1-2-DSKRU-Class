"use client";

import { useEffect, useState } from "react";
import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";

interface Student {
  no: string;
  nickname: string;
  fullname: string;
  image: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // ลิงก์ API ของ Google Sheets ของคุณ
    const SHEET_API_URL = "https://opensheet.elk.sh/1gsKgLKdNk602MogTQyBZ407NUhio81cG5ZdGW0K_AJE/Sheet1 ";

    fetch(SHEET_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("ดึงข้อมูลจาก API ไม่สำเร็จ");
        return res.json();
      })
      .then((data) => {
        console.log("ตรวจสอบข้อมูลดิบจาก API:", data);

        // ตรวจสอบว่าข้อมูลที่ได้มาเป็น Array หรือไม่
        if (Array.isArray(data)) {
          // เรียงลำดับเลขที่จากน้อยไปมาก
          const sortedData = data.sort((a: any, b: any) => {
            const noA = Number(a.no) || 0;
            const noB = Number(b.no) || 0;
            return noA - noB;
          });
          setStudents(sortedData);
        } else {
          // ถ้าไม่ใช่ Array ให้แปลงข้อมูลหรือแจ้งเตือน
          console.error("โครงสร้างข้อมูลไม่ใช่ Array:", data);
          setErrorMsg("โครงสร้างข้อมูลใน Google Sheets ไม่ถูกต้อง หรือยังไม่มีข้อมูลนักเรียน");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setErrorMsg("ไม่สามารถเชื่อมต่อกับ Google Sheets ได้ กรุณาเช็กการตั้งค่าแชร์");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-slate-400">กำลังโหลดรายชื่อเพื่อนๆ...</div>;
  }

  if (errorMsg) {
    return <div className="text-center py-10 text-danger">{errorMsg}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">รายชื่อนักเรียนในห้อง</h1>
      
      {students.length === 0 ? (
        <div className="text-center text-slate-500">ไม่พบข้อมูลนักเรียนในระบบ</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {students.map((student, index) => (
            <div 
              className="shadow-lg border border-white/10 p-5 rounded-2xl bg-white/5 backdrop-blur-sm flex flex-col items-center justify-between transition-transform hover:scale-[1.02]" 
              key={index}
            >
              <div className="w-full flex justify-end">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30">
                  เลขที่ {student.no || "-"}
                </span>
              </div>

              <div className="flex justify-center my-4">
                <Image
                  alt={`รูปของ ${student.nickname || "เพื่อน"}`}
                  className="object-cover rounded-xl aspect-square"
                  src={student.image || "https://via.placeholder.com/200"} 
                  width={200}
                  height={200}
                  isBlurred
                />
              </div>

              <div className="text-center w-full mt-2">
                <h3 className="text-xl font-bold text-white mb-1">
                  {student.nickname || "ไม่ได้ระบุชื่อเล่น"}
                </h3>
                <p className="text-sm text-slate-400">
                  {student.fullname || "ไม่ได้ระบุชื่อจริง"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}