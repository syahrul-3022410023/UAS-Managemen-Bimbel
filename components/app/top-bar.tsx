"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, LogOut, Menu, X } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { roleLabels, type UserRole } from "@/lib/auth/roles";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TopBarProps = {
  title: string;
  email: string;
  name?: string;
  role: UserRole;
  navigation: { label: string; href: string }[];
};

export function TopBar({ title, email, name, role, navigation }: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  // Ensure portal is only rendered client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile dropdown when clicking/touching outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const searchResults = searchQuery
    ? navigation.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    // Removed backdrop-blur from sticky header — causes touch event blocking on Android
    <header className="gsm-topbar sticky top-0 z-40 bg-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
      {/* Mobile: Hamburger + Title */}
      <div className="flex min-w-0 items-center gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", minWidth: 44, minHeight: 44, padding: 10 }}
          className="flex items-center justify-center rounded-xl bg-[#EEF0FF] text-brand active:bg-[#E4E7FF] transition border-none cursor-pointer"
          aria-label="Buka menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu size={22} />
        </button>
        <p className="min-w-0 truncate text-base font-bold text-ink">{title}</p>
      </div>

      {/* Desktop: Title */}
      <div className="hidden sm:flex mr-8 min-w-[190px] items-center gap-2 text-[13px]">
        <span className="text-slate-400">Pages</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-ink">{title}</span>
      </div>

      {/* Search Bar (Desktop only) */}
      <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
        <div className={`flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border transition ${isSearchFocused ? "border-brand/50" : "border-slate-200"}`}>
          <Search size={16} className="text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-slate-100 py-2 overflow-hidden z-50">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onMouseDown={() => router.push(item.href)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand transition"
                >
                  <Search size={14} className="inline mr-2 opacity-50" />
                  {item.label}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ditemukan</p>
            )}
          </div>
        )}
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-2 ml-3">
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#EEF0FF] text-brand font-semibold text-sm ring-1 ring-[#D8DCFF] hover:bg-[#E4E7FF] transition ml-1"
            aria-label="Profil"
          >
            {initial}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-100 p-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 mb-2">
                <p className="text-sm font-bold text-ink truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[#EEF0FF] text-brand text-[10px] font-bold rounded-md uppercase tracking-wide">
                  {roleLabels[role]}
                </span>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition">
                  <LogOut size={16} /> Keluar
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer — rendered via portal to avoid z-index issues */}
      {mounted && isMobileMenuOpen && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.45)" }}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              width: "86vw",
              maxWidth: 320,
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>B</div>
                <span style={{ fontWeight: 700, fontSize: 20, color: "#16202A" }}>Manajemen Bimbel</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ touchAction: "manipulation", padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
                aria-label="Tutup menu"
              >
                <X size={22} color="#94a3b8" />
              </button>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 12,
                    marginBottom: 4,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 500,
                    color: item.label === title ? "#2563EB" : "#475569",
                    backgroundColor: item.label === title ? "#EEF0FF" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              ))}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#64748b" }}
                  >
                    <LogOut size={18} color="#94a3b8" />
                    Keluar
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
