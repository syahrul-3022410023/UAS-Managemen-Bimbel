"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AppSelectOption = {
  value: string | number;
  label: string;
};

type AppSelectProps = {
  options: AppSelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  optionPrefix?: string;
};

export function AppSelect({
  options,
  value,
  defaultValue = "",
  onChange,
  name,
  placeholder = "Pilih data",
  disabled = false,
  required = false,
  className = "w-44",
  buttonClassName = "",
  optionPrefix,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [innerValue, setInnerValue] = useState(String(value ?? defaultValue ?? ""));
  const [menuRect, setMenuRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentValue = String(value ?? innerValue);
  const allOptions = useMemo(
    () => (placeholder ? [{ value: "", label: placeholder }, ...options] : options),
    [options, placeholder]
  );
  const selected = allOptions.find((option) => String(option.value) === currentValue) ?? allOptions[0];

  useEffect(() => {
    if (value !== undefined) setInnerValue(String(value));
  }, [value]);

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ left: rect.left, top: rect.bottom + 6, width: rect.width });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const pick = (nextValue: string | number) => {
    const next = String(nextValue);
    setInnerValue(next);
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={currentValue} disabled={disabled} required={required} /> : null}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 text-left text-sm font-medium transition ${
          open ? "border-brand ring-2 ring-brand/15" : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-ink"} ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">
          {optionPrefix && currentValue && selected?.value ? `${optionPrefix}: ${selected.label}` : selected?.label}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[10001] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          style={{ left: menuRect.left, top: menuRect.top, width: menuRect.width }}
        >
          {allOptions.map((option) => {
            const active = String(option.value) === currentValue;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => pick(option.value)}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-brand text-white" : "text-slate-600 hover:bg-[#EEF6FF] hover:text-brand"
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
