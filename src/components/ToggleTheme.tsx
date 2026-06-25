"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { FaSun, FaMoon } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // รอให้ Client โหลดเสร็จก่อน
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Dropdown showArrow>
      <DropdownTrigger>
        <Button color="success" variant="flat">
          {/* จุดสำคัญ: ถ้ายังไม่ mount ให้โชว์ FaGear ไปก่อน (ให้ตรงกับ Server) พอ mount เสร็จค่อยโชว์ไอคอนตาม Theme จริง */}
          {!mounted ? (
            <FaGear />
          ) : theme === "light" ? (
            <FaSun />
          ) : theme === "dark" ? (
            <FaMoon />
          ) : (
            <FaGear />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection={true}
        variant="flat"
        selectionMode="single"
        // ป้องกัน Error ตอนยังไม่ mount
        selectedKeys={new Set([mounted && theme ? theme : "system"])}
        // @ts-ignore
        onAction={(key: string) => setTheme(key)}
        aria-label="Actions"
      >
        <DropdownItem
          key="light"
          className="text-slate-800 dark:text-white"
          startContent={
            <FaSun className="text-xl text-default-500 pointer-events-none flex-shrink-0" />
          }
        >
          สว่าง
        </DropdownItem>
        <DropdownItem
          key="dark"
          className="text-slate-800 dark:text-white"
          startContent={
            <FaMoon className="text-xl text-default-500 pointer-events-none flex-shrink-0" />
          }
        >
          มืด
        </DropdownItem>
        <DropdownItem
          key="system"
          className="text-slate-800 dark:text-white"
          startContent={
            <FaGear className="text-xl text-default-500 pointer-events-none flex-shrink-0" />
          }
        >
          ตามระบบ
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}