"use client";

import {
  BookOpen, CalendarDays, LogOut, Users,
  Layers, UserSquare2, Package, UserCircle,
  ReceiptText, FileBarChart, GraduationCap, WalletCards, ArrowLeftRight,
  ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/roles";
import Link from "next/link";
import { TopBar } from "./top-bar";

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
    { title: "MAIN MENU", items: items.filter((item) => mainLabels.has(item.label)) },
    { title: "FEATURES", items: items.filter((item) => !mainLabels.has(item.label) && !generalLabels.has(item.label)) },
    { title: "GENERAL", items: items.filter((item) => generalLabels.has(item.label)) },
  ].filter((group) => group.items.length > 0);
}

export function AppShell({ role, email, name, title, activeNav, children }: AppShellProps) {
  const navGroups = groupedNavigation(role);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="gsm-app-frame h-screen overflow-hidden bg-surface flex text-ink font-sans">
      
      {/* Sidebar */}
      <aside className={`gsm-sidebar fixed inset-y-0 left-0 z-50 hidden bg-white md:flex flex-col transition-[width] duration-300 ${isSidebarCollapsed ? "w-[72px]" : "w-[252px]"}`}>
          <div className={`pb-4 pt-6 flex items-center ${isSidebarCollapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
          {!isSidebarCollapsed && (
            <>
              <div className="gsm-logo-mark flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
                <GraduationCap size={14} strokeWidth={2.1} />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[16px] font-bold text-ink">Manajemen</span>
                <span className="block truncate text-[16px] font-bold text-ink">Bimbel</span>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            aria-label={isSidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition hover:bg-blue-50 hover:text-brand"
          >
            <ChevronLeft size={15} className={isSidebarCollapsed ? "rotate-180" : ""} />
          </button>
        </div>
        
        {!isSidebarCollapsed && <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          <nav className="space-y-2">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = (activeNav ?? "Dashboard") === item.label;

                    return (
                      <Link
                        href={item.href}
                        key={item.label}
                        className={`gsm-nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                          isActive
                            ? "bg-blue-50 text-brand font-bold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon size={15} className={isActive ? "text-brand" : "text-slate-400 group-hover:text-brand"} strokeWidth={isActive ? 2.2 : 1.75} />
                        <span className="text-[13px]">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>}

        {!isSidebarCollapsed && <div className="px-4 pb-4">
          <form action={logoutAction} className="rounded-2xl bg-blue-50 p-3 text-brand">
            <div>
              <p className="text-sm font-bold">Keluar akun</p>
            </div>
            <button
              type="submit"
              className="mt-2.5 w-full group flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-white transition-all duration-300 hover:bg-brandHover"
            >
              <LogOut size={14} strokeWidth={1.9} />
              <span className="text-[12px] font-bold">Log out</span>
            </button>
          </form>
        </div>}
      </aside>

      {/* Main Content Area */}
      <div className={`gsm-panel flex-1 flex h-screen flex-col w-full min-w-0 overflow-hidden px-4 pb-4 md:pr-4 md:pb-4 transition-[padding] duration-300 ${isSidebarCollapsed ? "md:pl-[88px]" : "md:pl-[268px]"}`}>
        
        <TopBar 
          title={title} 
          email={email} 
          name={name} 
          role={role} 
          navigation={navigation[role].map(({ label, href }) => ({ label, href }))} 
        />
        
        {/* Page Content */}
        <main className="gsm-content flex-1 overflow-hidden p-5 sm:p-6 md:p-7 w-full min-w-0">
          <div className="gsm-content-inner h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
