"use client";

import {
  BookOpen, CalendarDays, LogOut, Users,
  Layers, UserSquare2, Package, UserCircle,
  ReceiptText, FileBarChart, WalletCards, ArrowLeftRight,
  ChevronLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/roles";
import Link from "next/link";
import { TopBar } from "./top-bar";
import { ToastProvider } from "./toast";

type AppShellProps = {
  role: UserRole;
  email: string;
  name?: string;
  title: string;
  activeNav?: string;
  children: React.ReactNode;
};

const navigation = {
  admin: [
    { label: "Dashboard", icon: BookOpen, href: "/admin/dashboard" },
    { label: "Siswa", icon: Users, href: "/admin/siswa" },
    { label: "Mentor", icon: UserSquare2, href: "/admin/mentor" },
    { label: "Orang Tua", icon: UserCircle, href: "/admin/orang-tua" },
    { label: "Paket Bimbel", icon: Package, href: "/admin/paket" },
    { label: "Kelas", icon: Layers, href: "/admin/kelas" },
    { label: "Jadwal", icon: CalendarDays, href: "/admin/jadwal" },
    { label: "Absensi", icon: UserSquare2, href: "/admin/absensi" },
    { label: "Invoice SPP", icon: ReceiptText, href: "/admin/invoice" },
    { label: "Gaji Mentor", icon: WalletCards, href: "/admin/gaji-mentor" },
    { label: "Arus Kas", icon: ArrowLeftRight, href: "/admin/arus-kas" },
    { label: "Laporan", icon: FileBarChart, href: "/admin/laporan" },
  ],
  mentor: [
    { label: "Dashboard", icon: BookOpen, href: "/mentor/dashboard" },
    { label: "Jadwal", icon: CalendarDays, href: "/mentor/jadwal" },
    { label: "Kelas", icon: Users, href: "/mentor/kelas" },
    { label: "Absensi", icon: UserSquare2, href: "/mentor/absensi" },
    { label: "Slip Gaji", icon: WalletCards, href: "/mentor/slip-gaji" }
  ],
  parent: [
    { label: "Dashboard", icon: BookOpen, href: "/orang-tua/dashboard" },
    { label: "Jadwal Anak", icon: CalendarDays, href: "/orang-tua/jadwal" },
    { label: "Absensi", icon: UserSquare2, href: "/orang-tua/absensi" },
    { label: "Invoice SPP", icon: ReceiptText, href: "/orang-tua/invoice" },
  ]
};

function groupedNavigation(role: UserRole) {
  const items = navigation[role];
  const mainLabels = new Set(["Dashboard", "Siswa", "Jadwal", "Jadwal Anak", "Kelas"]);
  const generalLabels = new Set(["Laporan", "Arus Kas", "Gaji Mentor", "Slip Gaji", "Invoice SPP"]);

  return [
    { title: "Menu Utama", items: items.filter((item) => mainLabels.has(item.label)) },
    { title: "Fitur", items: items.filter((item) => !mainLabels.has(item.label) && !generalLabels.has(item.label)) },
    { title: "Keuangan", items: items.filter((item) => generalLabels.has(item.label)) },
  ].filter((group) => group.items.length > 0);
}

export function AppShell({ role, email, name, title, activeNav, children }: AppShellProps) {
  const navGroups = groupedNavigation(role);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gsm-sidebar-collapsed");
    if (saved === "true") {
      setIsSidebarCollapsed(true);
    }
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gsm-sidebar-collapsed", String(next));
      return next;
    });
  };

  // Prevent Flash of Unstyled Content (FOUC) on refresh
  if (!isMounted) {
    return <div className="w-full h-dvh bg-surface" />;
  }

  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const activeLabel = activeNav ?? "Dashboard";

  return (
    <ToastProvider>
    <div className="gsm-app-frame w-full max-w-full h-dvh overflow-hidden bg-surface flex text-ink font-sans">
      
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`gsm-sidebar fixed inset-y-0 left-0 z-50 hidden md:flex flex-col overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-100 bg-white ${
          isSidebarCollapsed ? "w-[64px]" : "w-[200px]"
        }`}
      >
        {/* Logo area */}
        <div className="relative h-[72px] shrink-0 w-full">
          <div className="gsm-logo-mark absolute left-4 top-5 z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
            <img src="/logo-bimbel.png" alt="Logo Bimble Smart" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div className={`absolute left-[62px] top-4 flex flex-col justify-center whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <span className="block text-[13.5px] font-bold text-ink leading-tight">Bimble</span>
            <span className="block text-[13.5px] font-bold text-brand leading-tight">Smart</span>
          </div>
        </div>

        {/* ── Unified Nav ─── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-3 px-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navGroups.map((group, gi) => (
            <div key={group.title} className="flex flex-col w-full">
              <p
                className={`gsm-nav-group-label whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  isSidebarCollapsed ? "h-0 opacity-0 !m-0 p-0 pointer-events-none" : `h-[24px] opacity-100 ${gi === 0 ? "!mt-0" : ""}`
                }`}
              >
                {group.title}
              </p>

              <div className="space-y-1 w-full flex flex-col">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeLabel === item.label;
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      className={`group relative block h-[40px] w-full rounded-xl transition-colors duration-150 ${
                        isActive
                          ? "bg-blue-50/80 font-semibold text-brand"
                          : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <div className="absolute left-3 top-0 flex h-full items-center justify-center w-[16px]">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2.2 : 2.0}
                          className={`shrink-0 transition-colors ${isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                      </div>

                      {/* Expanded Text */}
                      <span className={`absolute left-[40px] top-[11px] whitespace-nowrap text-[13px] transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                        {item.label}
                      </span>

                      {/* Floating Tooltip Modal (Only in Collapsed Mode) */}
                      {isSidebarCollapsed && (
                        <div className="fixed left-[76px] mt-[4px] flex items-center justify-center bg-white text-slate-700 text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-[-12px] group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none">
                          {item.label}
                          {/* Triangle Pointer */}
                          <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-100 rotate-45 rounded-[2px]"></div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {gi < navGroups.length - 1 && (
                <div className={`border-b border-slate-100 transition-all duration-300 mx-auto ${isSidebarCollapsed ? "w-6 my-2" : "w-full my-4"}`} />
              )}
            </div>
          ))}
        </nav>

        {/* ── Logout block (Absolute layout for zero wobble) ─── */}
        <div className="relative border-t border-slate-100 w-full h-[65px] shrink-0">
          {/* Expanded State Elements */}
          <div className={`absolute inset-x-3 top-3 flex items-center gap-3 transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[12px] font-bold text-brand">
              {initial}
            </div>
            <div className="min-w-0 flex-1 flex-col">
              <p className="truncate text-[12px] font-semibold leading-tight text-slate-700">{displayName}</p>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">{email}</p>
            </div>
            <form action={logoutAction} className="shrink-0">
              <button
                type="submit"
                title="Keluar"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} strokeWidth={2.0} />
              </button>
            </form>
          </div>

          {/* Collapsed State Logout Button (Always at left-3) */}
          <form action={logoutAction} className={`absolute left-3 top-3 transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"}`}>
            <button
              type="submit"
              title="Keluar"
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 bg-slate-50 transition-colors"
            >
              <LogOut size={16} strokeWidth={2.0} />
            </button>
          </form>
        </div>

        {/* ── Toggle Button ── */}
        <button
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Perlebar Sidebar" : "Perkecil Sidebar"}
          className="relative h-11 w-full shrink-0 border-t border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <div className={`absolute top-[14px] transition-all duration-300 ${isSidebarCollapsed ? "left-[24px]" : "left-[92px]"}`}>
            <ChevronLeft size={16} strokeWidth={2.0} className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
          </div>
        </button>
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <div
        className={`gsm-panel flex-1 flex h-dvh flex-col w-full min-w-0 overflow-hidden px-4 pb-4 md:pr-4 md:pb-4 transition-[padding] duration-300 ease-in-out ${
          isSidebarCollapsed ? "md:pl-[64px]" : "md:pl-[200px]"
        }`}
      >
        <TopBar
          title={title}
          email={email}
          name={name}
          role={role}
          navigation={navigation[role].map(({ label, href }) => ({ label, href }))}
        />

        {/* Page content */}
        <main className="gsm-content flex-grow flex-shrink basis-0 flex flex-col overflow-hidden p-5 sm:p-6 w-full min-w-0">
          <div className="gsm-content-inner flex-grow flex-shrink basis-0 min-h-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
