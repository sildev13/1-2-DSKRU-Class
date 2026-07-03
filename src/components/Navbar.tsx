"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";

import ToggleTheme from "@/components/ToggleTheme";
import {
  Navbar,
  NavbarMenu,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";

const menuItems = [
  { label: "หน้าหลัก", href: "/" },
  { label: "ภาพรวม", href: "/dashboard" },
  { label: "งานของห้อง", href: "/tasks" },
  { label: "กระดานหักคะแนน", href: "/points" },
  { label: "วงล้อสุ่มหักแต้ม", href: "/spin" },
  { label: "เช็คชื่อ", href: "/attendance" },
  { label: "เก็บเงิน", href: "/money" },
  { label: "ประกาศ", href: "/board" },
  { label: "เวร", href: "/duty" },
  { label: "ตารางเรียน", href: "/schedule" },
  { label: "โหวต", href: "/vote" },
  { label: "กิจกรรมภายในห้อง", href: "/activity" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
  { label: "รายชื้อนักเรียน", href: "/list" },
  { label: "คลังเก็บโมเมนต์", href: "/gallery" },
  { label: "Website Status", href: "https://status.suphason.space/" },
];

export default () => {
  const [user, setUser] = useState<{ username: string; name: string | null; isHead: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Navbar shouldHideOnScroll={true} className="text-black dark:text-white">
      <NavbarContent justify="start">
        <NavbarMenuToggle aria-label={"Open/Close menu"} />
      </NavbarContent>

      <NavbarContent justify="center">
        <NavbarBrand>
          <NextLink href="/" className="font-bold text-slate-800 text-inherit uppercase dark:text-white">
            1/2 Room Website
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end">
        {user && (
          <NavbarItem className="hidden sm:flex">
            <span className="text-sm text-default-500">{user.name || user.username}</span>
          </NavbarItem>
        )}
        <NavbarItem>
          <ToggleTheme />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.href}-${index}`}>
            <Link className="w-full" color="foreground" size="lg" href={item.href} as={NextLink}>
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}

        {user?.isHead && (
          <NavbarMenuItem>
            <Link className="w-full" color="primary" size="lg" href="/users" as={NextLink}>
              จัดการผู้ใช้
            </Link>
          </NavbarMenuItem>
        )}

        {user && (
          <NavbarMenuItem>
            <button onClick={logout} className="w-full text-left text-lg text-danger">
              ออกจากระบบ
            </button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
};
