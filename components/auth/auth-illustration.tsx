"use client";

import React from "react";

export function AuthIllustration() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-[#EEF0FF] via-[#D7DCFF] to-[#B7BFFF] p-5 md:p-8 text-[#111827]">
      {/* Background Floating Hexagons */}
      <svg
        className="auth-illustration-orbit absolute inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hex-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        
        {/* Hexagon 1 */}
        <polygon
          className="auth-hex auth-hex-1"
          points="320,120 350,102 380,120 380,155 350,173 320,155"
          fill="url(#hex-grad)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />
        
        {/* Hexagon 2 */}
        <polygon
          className="auth-hex auth-hex-2"
          points="240,240 265,225 290,240 290,270 265,285 240,270"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.5"
        />
        
        {/* Hexagon 3 */}
        <polygon
          className="auth-hex auth-hex-3"
          points="380,220 415,200 450,220 450,260 415,280 380,260"
          fill="url(#hex-grad)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2"
        />

        {/* Hexagon 4 - small top */}
        <polygon
          className="auth-hex auth-hex-4"
          points="80,60 95,51 110,60 110,78 95,87 80,78"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
      </svg>

      {/* Top Branding Section */}
      <div className="relative z-10 w-full">
        {/* Logo Icon */}
        <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/55 backdrop-blur-md border border-white/70">
          <svg
            className="h-5 w-5 md:h-6 md:w-6 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {/* Elegant Education / Graduation Cap / House combination */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Typography / Copywriting */}
        <h2 className="auth-illustration-title mt-2.5 md:mt-8 text-lg md:app-title-primary text-[#111827] leading-snug max-w-sm">
          Satu klik untuk kelola semua bimbingan belajar.
        </h2>
        <p className="auth-illustration-desc mt-3 md:mt-4 hidden md:block app-caption text-slate-500 leading-relaxed max-w-xs">
          Pantau perkembangan belajar siswa, jadwal kelas, dan presensi secara real-time dalam satu platform bimbel terintegrasi.
        </p>
      </div>

      {/* Graphic Elements Section - Visible on both mobile (scaled down) and desktop */}
      <div className="relative mt-auto flex items-end justify-between pt-6 md:pt-12 w-full">
        {/* Left Side: Plant and Character */}
        <div className="flex items-end space-x-2 z-10 shrink-0">
          {/* Potted Plant */}
          <div className="mb-1.5 md:mb-2 shrink-0">
            <svg
              className="auth-plant h-14 md:h-20 w-8 md:w-12 select-none"
              viewBox="0 0 60 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Pot */}
              <path d="M 15,60 L 20,90 H 40 L 45,60 Z" fill="#F59E0B" />
              <rect x="12" y="54" width="36" height="6" rx="2" fill="#D97706" />
              
              {/* Succulent Leaves */}
              <path d="M 30,54 C 30,54 25,25 30,10 C 35,25 30,54 30,54 Z" fill="#38BDF8" opacity="0.95" />
              <path d="M 28,54 C 28,54 10,35 18,22 C 24,32 28,54 28,54 Z" fill="#0284C7" />
              <path d="M 32,54 C 32,54 50,35 42,22 C 36,32 32,54 32,54 Z" fill="#0284C7" />
              <path d="M 30,54 C 30,54 20,40 25,32 C 28,38 30,54 30,54 Z" fill="#BAE6FD" />
              <path d="M 30,54 C 30,54 40,40 35,32 C 32,38 30,54 30,54 Z" fill="#BAE6FD" />
            </svg>
          </div>

          {/* Stylized Standing Character (Facing slightly right) */}
          <div className="shrink-0">
            <svg
              className="auth-illustration-character h-36 sm:h-44 md:h-56 w-16 sm:w-20 md:w-24 select-none"
              viewBox="0 0 120 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hair/Head */}
              <circle cx="55" cy="35" r="14" fill="#0F172A" />
              <circle cx="57" cy="37" r="11" fill="#FDBA74" />
              <g className="auth-character-eyes">
                <circle cx="54" cy="36" r="1.3" fill="#0F172A" />
                <circle cx="62" cy="36" r="1.3" fill="#0F172A" />
              </g>
              {/* Beard */}
              <path d="M 52,42 Q 62,50 67,42 Q 67,36 57,35 Z" fill="#0F172A" />
              {/* Nose */}
              <path d="M 68,36 H 70 V 38 H 68 Z" fill="#FDBA74" />
              {/* Hair front */}
              <path d="M 46,30 Q 55,21 66,27 Q 61,34 50,34 Z" fill="#0F172A" />
              
              {/* Neck */}
              <rect x="52" y="47" width="5" height="7" fill="#FDBA74" />
              
              {/* Body (Orange-Red Polo T-Shirt) */}
              <path d="M 42,54 C 50,52 68,52 76,54 L 73,115 H 45 L 42,54 Z" fill="#F43F5E" />
              
              {/* Arms Crossed */}
              <path d="M 45,63 C 51,75 70,75 73,63" stroke="#F43F5E" strokeWidth="10" strokeLinecap="round" />
              <path d="M 49,67 Q 59,76 68,67" stroke="#E11D48" strokeWidth="6" strokeLinecap="round" />
              {/* Tiny Hands */}
              <circle cx="49" cy="67" r="3" fill="#FDBA74" />
              <circle cx="68" cy="67" r="3" fill="#FDBA74" />
              
              {/* Legs (Slate Pants) */}
              <path d="M 45,115 H 73 L 75,220 H 62 L 59,165 L 56,220 H 43 L 45,115 Z" fill="#334155" />
              
              {/* Shoes */}
              <path d="M 43,220 H 54 Q 57,225 49,226 H 39 Z" fill="#1E293B" />
              <path d="M 62,220 H 73 Q 76,225 68,226 H 58 Z" fill="#1E293B" />
            </svg>
          </div>
        </div>

        {/* Right Side: Interactive 3D Tablet Dashboard - Always visible and responsive */}
        <div
          className="auth-illustration-tablet absolute right-[-15px] sm:right-[-30px] md:right-[-40px] bottom-1.5 md:bottom-6 z-20"
          style={{
            perspective: "1000px",
          }}
        >
          {/* Tilted Tablet Case */}
          <div
            className="auth-tablet-body w-[180px] sm:w-[220px] md:w-[280px] h-[125px] sm:h-[150px] md:h-[190px] rounded-xl md:rounded-2xl bg-white/95 p-2 md:p-3 border border-white select-none transition-all duration-500 hover:translate-x-1"
          >
            {/* Tablet Header / Bar */}
            <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
              {/* Tablet Camera / Bar */}
              <div className="w-8 md:w-12 h-1 md:h-1.5 bg-slate-100 rounded-full" />
              {/* Window Controls */}
              <div className="flex space-x-0.5 md:space-x-1">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-rose-400 rounded-full" />
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-400 rounded-full" />
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-400 rounded-full" />
              </div>
            </div>
            
            {/* Tablet Main Panel Grid */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-2.5 h-[calc(100%-10px)] md:h-[calc(100%-20px)]">
              {/* Left Widget: Upward Trend line */}
              <div className="col-span-2 bg-slate-50/80 rounded-lg md:rounded-xl p-1.5 md:p-2.5 flex flex-col justify-between border border-slate-100">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-[7px] md:text-[10px] text-blue-800 font-bold">M</span>
                  </div>
                  <div>
                    <div className="auth-skeleton w-10 md:w-14 h-1 md:h-1.5 bg-slate-200 rounded" />
                    <div className="auth-skeleton auth-skeleton-short w-6 md:w-8 h-0.5 md:h-1 bg-slate-100 rounded mt-0.5" />
                  </div>
                </div>

                {/* Graph visualization - Blue stroke */}
                <svg className="w-full h-9 md:h-14 mt-1" viewBox="0 0 100 40">
                  <path
                    className="auth-trend-line"
                    d="M 0,35 Q 20,20 40,26 T 80,12 T 100,6"
                    fill="none"
                    stroke="#3947FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    className="auth-trend-fill"
                    d="M 0,35 Q 20,20 40,26 T 80,12 T 100,6 L 100,40 L 0,40 Z"
                    fill="url(#trend-grad-m)"
                    opacity="0.12"
                  />
                  <defs>
                    <linearGradient id="trend-grad-m" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3947FF" />
                      <stop offset="100%" stopColor="#3947FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Indicator Dot */}
                  <circle className="auth-trend-dot" r="2.5" fill="#3947FF">
                    <animateMotion
                      dur="4.8s"
                      path="M 0,35 Q 20,20 40,26 T 80,12 T 100,6"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle className="auth-trend-halo" r="4.5" fill="#3947FF" opacity="0.3">
                    <animateMotion
                      dur="4.8s"
                      path="M 0,35 Q 20,20 40,26 T 80,12 T 100,6"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
              
              {/* Right Widget Column */}
              <div className="flex flex-col space-y-1 md:space-y-2">
                {/* Micro Dark Widget */}
                <div className="bg-slate-900 text-white rounded-lg md:rounded-xl p-1 md:p-2 flex-1 flex flex-col justify-between">
                  <div className="w-6 h-1 bg-slate-800 rounded" />
                  <svg className="w-full h-6 mt-0.5" viewBox="0 0 50 20">
                    <path
                      className="auth-live-line"
                      d="M 0,16 Q 12,4 25,12 T 50,4"
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                
                {/* Live Indicator / Action button - Blue */}
                <div className="auth-live-button bg-brand text-white rounded-lg md:rounded-xl p-1 md:p-2 flex items-center justify-center space-x-1 hover:bg-brandHover cursor-pointer transition-all duration-300">
                  <div className="auth-live-dot w-2.5 h-2.5 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  <span className="text-[6px] md:text-[8px] font-extrabold tracking-wider">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
