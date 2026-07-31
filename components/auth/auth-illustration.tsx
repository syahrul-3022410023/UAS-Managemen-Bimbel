"use client";

import { GraduationCap, CalendarCheck, ReceiptText, TrendingUp, Sparkles } from "lucide-react";

const scheduleItems = [
  { time: "08.00", subject: "Matematika", room: "Kelas A" },
  { time: "10.00", subject: "Fisika", room: "Kelas B" },
  { time: "13.00", subject: "Kimia", room: "Kelas C" },
];

const statBars = [38, 56, 44, 72, 62, 88, 78];

export function AuthIllustration() {
  return (
    <div className="auth-product-panel relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.4rem] bg-[#0B6FFB] p-6 text-white md:p-8">
      {/* Background grid */}
      <div className="auth-product-grid absolute inset-0" />

      {/* Ambient glows */}
      <div className="auth-product-glow auth-product-glow-1 absolute" />
      <div className="auth-product-glow auth-product-glow-2 absolute" />

      {/* Decorative SVG paths */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
        viewBox="0 0 480 680"
        fill="none"
        aria-hidden="true"
      >
        {/* Flowing curve at bottom */}
        <path
          className="auth-product-line"
          d="M-20 580 C72 520 112 598 188 552 C270 502 326 580 406 532 C480 488 528 528 560 490"
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="10 16"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
        {/* Top-left corner accent */}
        <path
          className="auth-product-line auth-product-line-2"
          d="M10 72 L42 52 L42 22 L74 6"
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="4 8"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        {/* Top-right corner accent */}
        <path
          className="auth-product-line auth-product-line-3"
          d="M410 68 L448 92 L448 136 L490 162"
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="4 8"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        {/* Hexagon shapes */}
        <path
          className="auth-product-hex"
          d="M430 560 L488 594 L488 660 L430 694 L372 660 L372 594 Z"
          stroke="rgba(255,255,255,0.14)"
          strokeDasharray="8 14"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
        <path
          className="auth-product-hex auth-product-hex-2"
          d="M-14 564 L30 590 L30 642 L-14 668 L-58 642 L-58 590 Z"
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="8 14"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>

      {/* ── Top: Logo + badge ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="auth-product-logo flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B6FFB]">
          <GraduationCap size={24} strokeWidth={2.2} />
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
          <Sparkles size={11} className="text-white/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">
            Terpadu
          </span>
        </div>
      </div>

      {/* ── Middle: Floating mockup card ── */}
      <div className="relative z-10 mt-5 md:mt-6">
        {/* Main mockup window */}
        <div className="auth-product-screen relative rounded-2xl border border-white/15 bg-[#061d4a]/90 p-3.5 backdrop-blur-sm shadow-[0_20px_60px_rgba(3,18,54,0.4)]">
          {/* Window chrome */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" />
            </div>
            <div className="h-1.5 w-20 rounded-full bg-white/10" />
          </div>

          {/* App header bar */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0B6FFB]/80">
                <GraduationCap size={12} className="text-white" />
              </div>
              <span className="text-[11px] font-semibold text-white/90">Dasbor Utama</span>
            </div>
            <div className="flex gap-1">
              {[1,2,3].map(i => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/25" />
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-[1fr_1fr] gap-2.5 md:gap-3">
            {/* Left col: Schedule */}
            <div className="rounded-xl bg-white/[0.055] p-2.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-cyan-300">
                  <CalendarCheck size={12} />
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                  Jadwal Hari Ini
                </span>
              </div>
              <div className="space-y-1.5">
                {scheduleItems.map((item, i) => (
                  <div
                    key={item.subject}
                    className="auth-product-stat flex items-center gap-2 rounded-lg bg-white/[0.065] px-2 py-1.5"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <span className="min-w-[28px] text-[9px] font-bold tabular-nums text-white/50">{item.time}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-white/90">{item.subject}</p>
                      <p className="text-[8.5px] text-white/40">{item.room}</p>
                    </div>
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right col: Stats */}
            <div className="flex flex-col gap-2.5">
              {/* Invoice stat */}
              <div className="auth-product-stat flex items-center gap-2 rounded-xl bg-white/[0.055] p-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300">
                  <ReceiptText size={13} />
                </div>
                <div>
                  <p className="text-[9px] text-white/45">Invoice</p>
                  <p className="text-[13px] font-bold text-white">24 Lunas</p>
                </div>
              </div>

              {/* Trend stat */}
              <div className="auth-product-stat flex items-center gap-2 rounded-xl bg-white/[0.055] p-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300">
                  <TrendingUp size={13} />
                </div>
                <div>
                  <p className="text-[9px] text-white/45">Kehadiran</p>
                  <p className="text-[13px] font-bold text-white">92%</p>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="rounded-xl bg-white/[0.055] p-2.5">
                <p className="mb-2 text-[9px] text-white/40">Aktivitas</p>
                <div className="flex h-10 items-end gap-1">
                  {statBars.map((h, i) => (
                    <div
                      key={i}
                      className="auth-product-mini-bar flex-1 rounded-full bg-gradient-to-t from-[#0B6FFB] to-[#36C5F0]"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 85}ms`,
                        opacity: i === 5 ? 1 : 0.65 + i * 0.05,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating notification chip */}
        <div className="auth-product-float-card absolute -bottom-8 -right-1 flex items-center gap-2 rounded-2xl border border-white/30 bg-white px-3 py-2.5 text-[#0B1220] shadow-[0_12px_32px_rgba(3,18,54,0.18)]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-[10px]">✓</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-700">Laporan Selesai</p>
            <p className="text-[8px] text-slate-400">Tersinkron otomatis</p>
          </div>
        </div>
      </div>

      {/* ── Bottom: Unified copy (NO role enumeration) ── */}
      <div className="relative z-10 mt-12 md:mt-14">
        {/* Thin divider */}
        <div className="mb-4 h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

        <p className="text-center text-[1.32rem] font-bold leading-[1.25] tracking-[-0.015em] text-white md:text-[1.42rem]">
          Satu dasbor,<br />
          semua terkendali.
        </p>
        <p className="mx-auto mt-3 max-w-[15rem] text-center text-[0.8rem] leading-relaxed text-white/65">
          Jadwal, absensi, invoice, dan laporan — otomatis tersinkron setiap saat.
        </p>
      </div>
    </div>
  );
}
