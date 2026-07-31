"use client";

// Toast Notification System
// Heuristik H1: Visibility of System Status — setiap aksi harus ada feedback

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-white",
    border: "border-emerald-100",
    icon: <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />,
  },
  error: {
    bg: "bg-white",
    border: "border-red-100",
    icon: <XCircle size={18} className="shrink-0 text-red-500" />,
  },
  info: {
    bg: "bg-white",
    border: "border-blue-100",
    icon: <Info size={18} className="shrink-0 text-blue-500" />,
  },
};

function ToastItemComponent({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const style = variantStyles[item.variant];

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto dismiss after 3.5s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 300);
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [item.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 ${style.bg} border ${style.border} rounded-2xl px-4 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-w-[260px] max-w-[340px] transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {style.icon}
      <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{item.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(item.id), 300); }}
        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container — bottom right */}
      <div
        aria-live="polite"
        aria-label="Notifikasi"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItemComponent item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
