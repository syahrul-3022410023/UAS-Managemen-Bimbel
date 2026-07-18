"use client";

import { BookOpen, CalendarCheck, GraduationCap, ReceiptText, Sparkles, Users } from "lucide-react";

const rows = [
  ["Admin", "Invoice", "08.00", "Pantau"],
  ["Mentor", "Jadwal", "16.00", "Mengajar"],
  ["Orang Tua", "Absensi", "17.30", "Terima"],
  ["Siswa", "Kelas", "19.00", "Aktif"],
];

const stats = [
  { label: "Admin", value: "Kontrol", icon: Users },
  { label: "Mentor", value: "Jadwal", icon: CalendarCheck },
  { label: "Ortu", value: "Update", icon: ReceiptText },
];

export function AuthIllustration() {
  return (
    <div className="auth-product-panel relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.65rem] bg-[#0B6FFB] p-5 text-white md:p-8">
      <div className="auth-product-grid absolute inset-0" />
      <div className="auth-product-glow auth-product-glow-1 absolute" />
      <div className="auth-product-glow auth-product-glow-2 absolute" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-70" viewBox="0 0 620 720" fill="none" aria-hidden="true">
        <path className="auth-product-line" d="M-20 660 C72 588 112 666 188 612 C270 554 326 648 406 590 C480 536 528 580 640 510" />
        <path className="auth-product-line auth-product-line-2" d="M18 84 L48 62 L48 28 L82 8" />
        <path className="auth-product-line auth-product-line-3" d="M530 82 L572 108 L572 156 L620 186" />
        <path className="auth-product-hex" d="M520 602 L590 642 L590 720 L520 760 L450 720 L450 642 Z" />
        <path className="auth-product-hex auth-product-hex-2" d="M12 606 L60 634 L60 690 L12 718 L-36 690 L-36 634 Z" />
      </svg>

      <div className="relative z-10 flex items-center justify-between">
        <div className="auth-product-logo flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0B6FFB]">
          <GraduationCap size={28} strokeWidth={2.2} />
        </div>
        <div className="rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
          3 role workspace
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-5 w-full max-w-[430px] md:mt-8">
        <div className="auth-product-screen rounded-[1.35rem] border border-white/20 bg-[#082451]/95 p-3 shadow-[0_26px_70px_rgba(3,18,54,0.34)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="h-2 w-16 rounded-full bg-white/12" />
          </div>

          <div className="grid gap-3 md:grid-cols-[0.72fr_1fr]">
            <div className="rounded-2xl bg-white/[0.06] p-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/40">Satu sistem</p>
                  <p className="text-sm font-semibold text-white">Tiga akses</p>
                </div>
              </div>
              <div className="space-y-2">
                {stats.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="auth-product-stat flex items-center justify-between rounded-xl bg-white/[0.07] px-2.5 py-2" style={{ animationDelay: `${index * 130}ms` }}>
                      <span className="flex items-center gap-2 text-[11px] text-white/72">
                        <Icon size={13} />
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.06] p-3">
              <div className="mb-2 grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 text-[9px] uppercase tracking-wide text-white/35">
                <span>Role</span>
                <span>Modul</span>
                <span>Jam</span>
                <span>Status</span>
              </div>
              <div className="space-y-1.5">
                {rows.map((row, index) => (
                  <div key={row.join("-")} className="auth-product-row grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 rounded-lg bg-white/[0.075] px-2 py-2 text-[10px] text-white/78" style={{ animationDelay: `${index * 120}ms` }}>
                    {row.map((cell) => (
                      <span key={cell} className="truncate">{cell}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="auth-product-float-card absolute -bottom-10 right-2 w-[42%] min-w-[150px] rounded-2xl border border-white/35 bg-white p-3 text-[#0B1220] shadow-[0_22px_48px_rgba(3,18,54,0.22)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ringkasan harian</p>
            <Sparkles size={14} className="text-[#0B6FFB]" />
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {[44, 64, 48, 76, 58, 88, 72].map((height, index) => (
              <span key={index} className="auth-product-mini-bar block flex-1 rounded-full bg-gradient-to-t from-[#0B6FFB] to-[#36C5F0]" style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-14 md:mt-16">
        <p className="max-w-md text-center text-[1.35rem] font-semibold leading-tight text-white md:text-[1.45rem]">
          Satu platform untuk admin mengelola, mentor mengajar, dan orang tua memantau perkembangan anak.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-white/76">
          Jadwal, absensi, invoice, dan laporan tersinkron otomatis sesuai peran masing-masing.
        </p>
      </div>
    </div>
  );
}
