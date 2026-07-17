import { 
  BookOpen, CalendarDays, CreditCard, LogOut, Users, 
  Layers, UserSquare2, Package, BookType, UserCircle,
  ReceiptText, FileBarChart
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
    { label: "Paket", icon: Package, href: "/admin/paket" },
    { label: "Mata Pelajaran", icon: BookType, href: "/admin/mata-pelajaran" },
    { label: "Kelas", icon: Layers, href: "/admin/kelas" },
    { label: "Jadwal", icon: CalendarDays, href: "/admin/jadwal" },
    { label: "Absensi", icon: UserSquare2, href: "/admin/absensi" },
    { label: "Invoice", icon: ReceiptText, href: "/admin/invoice" },
    { label: "Pembayaran", icon: CreditCard, href: "/admin/pembayaran" },
    { label: "Laporan", icon: FileBarChart, href: "/admin/laporan" },
  ],
  mentor: [
    { label: "Dashboard", icon: BookOpen, href: "/mentor/dashboard" },
    { label: "Jadwal", icon: CalendarDays, href: "/mentor/jadwal" },
    { label: "Kelas", icon: Users, href: "/mentor/kelas" },
    { label: "Absensi", icon: UserSquare2, href: "/mentor/absensi" }
  ],
  parent: [
    { label: "Dashboard", icon: BookOpen, href: "/orang-tua/dashboard" },
    { label: "Jadwal Anak", icon: CalendarDays, href: "/orang-tua/jadwal" },
    { label: "Absensi", icon: UserSquare2, href: "/orang-tua/absensi" },
    { label: "Invoice", icon: ReceiptText, href: "/orang-tua/invoice" },
  ]
};

export function AppShell({ role, email, name, title, activeNav, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface flex text-ink font-sans">
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] bg-white md:flex flex-col border-r border-slate-100">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="font-bold text-xl tracking-tight">BimbelPro</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <nav className="space-y-1">
            {navigation[role].map((item) => {
              const Icon = item.icon;
              const isActive = (activeNav ?? "Dashboard") === item.label;
              
              return (
                <Link 
                  href={item.href} 
                  key={item.label}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-brand/10 text-brand font-medium" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-600"} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[14px]">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <form action={logoutAction} className="pt-2">
              <button
                type="submit"
                className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut size={18} className="text-slate-400 group-hover:text-red-500" strokeWidth={2} />
                <span className="text-[14px]">Log out</span>
              </button>
            </form>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-[260px] flex flex-col min-h-screen w-full min-w-0">
        
        <TopBar 
          title={title} 
          email={email} 
          name={name} 
          role={role} 
          navigation={navigation[role].map(({ label, href }) => ({ label, href }))} 
        />
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
