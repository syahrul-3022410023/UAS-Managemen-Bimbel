import {
  BookOpen, CalendarDays, CreditCard, LogOut, Users, 
  Layers, UserSquare2, Package, BookType, UserCircle,
  ReceiptText, FileBarChart, GraduationCap, WalletCards, ArrowLeftRight
} from "lucide-react";
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

// Sprint 5: Invoice & Pembayaran navigation activated
const navigation = {
  admin: [
    { label: "Dashboard", icon: BookOpen, href: "/admin/dashboard" },
    { label: "Siswa", icon: Users, href: "/admin/siswa" },
    { label: "Mentor", icon: UserSquare2, href: "/admin/mentor" },
    { label: "Orang Tua", icon: UserCircle, href: "/admin/orang-tua" },
    { label: "Paket Bimbel", icon: Package, href: "/admin/paket" },
    { label: "Mata Pelajaran", icon: BookType, href: "/admin/mata-pelajaran" },
    { label: "Kelas", icon: Layers, href: "/admin/kelas" },
    { label: "Jadwal", icon: CalendarDays, href: "/admin/jadwal" },
    { label: "Absensi", icon: UserSquare2, href: "/admin/absensi" },
    { label: "Invoice SPP", icon: ReceiptText, href: "/admin/invoice" },
    { label: "Pembayaran", icon: CreditCard, href: "/admin/pembayaran" },
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

export function AppShell({ role, email, name, title, activeNav, children }: AppShellProps) {
  return (
    <div className="gsm-app-frame min-h-screen bg-surface flex text-ink font-sans">
      
      {/* Sidebar */}
      <aside className="gsm-sidebar fixed inset-y-0 left-0 hidden w-[260px] bg-white md:flex flex-col border-r border-slate-100">
        <div className="px-6 py-7 flex items-center gap-3">
          <div className="gsm-logo-mark flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
            <GraduationCap size={17} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <span className="block text-[14px] font-semibold text-ink">BimbelPro</span>
            <span className="block text-[11px] font-medium text-slate-400">Management</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <nav className="space-y-0.5">
            {navigation[role].map((item) => {
              const Icon = item.icon;
              const isActive = (activeNav ?? "Dashboard") === item.label;
              
              return (
                <Link 
                  href={item.href} 
                  key={item.label}
                  className={`gsm-nav-item group relative flex items-center justify-between px-2.5 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? "bg-[#EEF0FF] text-brand font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? "text-brand" : "text-slate-400 group-hover:text-brand"} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <form action={logoutAction} className="pt-2">
              <button
                type="submit"
                className="w-full group flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-brand transition-all duration-300"
              >
                <LogOut size={17} className="text-slate-400 group-hover:text-brand" strokeWidth={2} />
                <span className="text-[13px]">Log out</span>
              </button>
            </form>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="gsm-panel flex-1 md:pl-[260px] flex flex-col min-h-screen w-full min-w-0">
        
        <TopBar 
          title={title} 
          email={email} 
          name={name} 
          role={role} 
          navigation={navigation[role].map(({ label, href }) => ({ label, href }))} 
        />
        
        {/* Page Content */}
        <main className="gsm-content flex-1 p-4 sm:p-6 md:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
