"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Bell, Mail, HelpCircle, LogOut, User as UserIcon, Menu, X } from "lucide-react";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchQuery
    ? navigation.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-slate-200/50 px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:hidden">
        <button onClick={() => setIsMobileMenuOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand transition">
          <Menu size={22} />
        </button>
        <p className="text-base font-semibold text-ink">{title}</p>
      </div>
      
      <p className="hidden sm:block mr-4 text-base font-semibold text-ink">{title}</p>
      
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border transition ${isSearchFocused ? 'border-brand/30 ring-2 ring-brand/10' : 'border-slate-100'}`}>
          <Search size={16} className="text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Pencarian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.label}
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

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button 
            onClick={() => {
              // Close profile if open
              if (isProfileOpen) setIsProfileOpen(false);
              // Toggle more menu (we will just reuse isProfileOpen for simplicity or create a new state)
              // Actually since it's just dummy icons, let's just make it a hover or simple click.
              // We'll use a new state if needed, or simply hide them as requested by user.
              // Wait, the user said "hilangkan gapapa". Let's just remove them to make it clean!
            }}
            className="hidden" // Hiding them entirely as they are just dummy placeholders for now and user said 'hilangkan gapapa'
          >
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition ml-1"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-cyan-400 flex items-center justify-center text-white font-medium text-sm shadow-sm">
              {initial}
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 mb-2">
                <p className="text-sm font-bold text-ink truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-md uppercase tracking-wide">
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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex sm:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative flex w-4/5 max-w-[280px] flex-col bg-white shadow-2xl animate-in slide-in-from-left h-full">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">B</div>
                <span className="font-bold text-xl tracking-tight text-ink">BimbelPro</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    item.label === title 
                      ? "bg-brand/10 text-brand"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="mt-8 border-t border-slate-100 pt-4">
                <form action={logoutAction}>
                  <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition">
                    <LogOut size={18} className="text-slate-400" />
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
