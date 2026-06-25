"use client";

import { useEffect, useState } from "react";
import { Image } from "@nextui-org/image";
import { Card, CardFooter } from "@nextui-org/card";

interface GalleryItem {
  title: string;
  date: string;
  image: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // ใช้ ID เดิมของคุณ แต่เปลี่ยนคำว่า Sheet1 ตัวสุดท้ายเป็น Gallery ตามชื่อแท็บใหม่
    const SHEET_API_URL = "https://opensheet.elk.sh/1gsKgLKdNk602MogTQyBZ407NUhio81cG5ZdGW0K_AJE/Sheet2";

    fetch(SHEET_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("ดึงข้อมูลรูปภาพไม่สำเร็จ");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPhotos(data);
        } else {
          console.error("โครงสร้างข้อมูลไม่ใช่ Array:", data);
          setErrorMsg("โครงสร้างข้อมูลใน Google Sheets (แท็บ Gallery) ไม่ถูกต้อง");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching gallery:", err);
        setErrorMsg("ไม่สามารถดึงข้อมูลคลังภาพได้ กรุณาเช็กชื่อแท็บใน Google Sheets");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-slate-400">กำลังเปิดคลังภาพความทรงจำ...</div>;
  }

  if (errorMsg) {
    return <div className="text-center py-10 text-danger">{errorMsg}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-2">
          Class Gallery 📸
        </h1>
        <p className="text-slate-400 text-sm">รวมโมเมนต์สุดปั่น และภาพความทรงจำของพวกเรา</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center text-slate-500 py-10">ยังไม่มีรูปภาพในคลังภาพ มาร่วมแชร์รูปกันเถอะ!</div>
      ) : (
        /* จัดเรียงรูปแบบคลังภาพสวยๆ สไตล์การ์ด */
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((item, index) => (
            <Card 
              isFooterBlurred 
              radius="lg" 
              className="border-none bg-black/5 shadow-md overflow-hidden group hover:scale-[1.02] transition-transform"
              key={index}
            >
              <Image
                alt={item.title || "Class Moment"}
                className="object-cover w-full aspect-[4/3] group-hover:scale-105 transition-transform duration-300"
                src={item.image || "https://via.placeholder.com/400x300"}
                width="100%"
              />
              {/* แถบคำอธิบายภาพด้านล่างแบบเบลอหรูหรา */}
              <CardFooter className="justify-between items-start before:bg-black/10 border-white/25 border-1 overflow-hidden py-2.5 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10 flex-col gap-0.5">
                <p className="text-sm font-bold text-black/90 text-left w-full truncate">
                  {item.title || "ไม่ได้ระบุแคปชั่น"}
                </p>
                <span className="text-[11px] text-black/60 font-medium">
                  {item.date || "ไม่ระบุวันเวลา"}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}