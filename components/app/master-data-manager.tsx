"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Eye, GraduationCap, Package, Pencil, Plus, Search, SearchX, Trash2, UserRound, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { deleteMasterData, saveMasterData, type MasterEntity } from "@/app/admin/master-data/actions";
import { ConfirmDialog } from "./confirm-dialog";
import { AppSelect } from "./app-select";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "password" | "textarea" | "select" | "multiselect";
  options?: { value: string; label: string }[];
  table?: boolean;
  form?: boolean;
};
export type MasterValue = string | number | string[] | null;
export type MasterRecord = Record<string, MasterValue> & { id: string };

type Props = { entity: MasterEntity; singular: string; title: string; description: string; fields: Field[]; rows: MasterRecord[]; detailBasePath?: string };
const optionalFields = ["address", "description", "birth_date", "school_name", "grade", "parent_id", "package_id", "subject_id", "class_ids", "specialization", "level", "profile_id", "account_email", "account_password"];
const priceFields = new Set(["price", "mentor_fee_per_session"]);
const entityIcons = {
  students: GraduationCap,
  mentors: UserRound,
  parents: Users,
  packages: Package,
  subjects: BookOpen,
} satisfies Record<MasterEntity, LucideIcon>;
const tableColumnWidth = (field: Field, fieldCount: number) => {
  if (field.key === "phone" || field.key.includes("phone")) return "180px";
  if (field.key === "account_name" || field.key.includes("email")) return "34%";
  if (priceFields.has(field.key)) return "170px";
  if (fieldCount <= 3 && field.key === "full_name") return "30%";
  return undefined;
};
const display = (value: MasterValue) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value === null || value === "" ? "—" : typeof value === "number" ? new Intl.NumberFormat("id-ID").format(value) : value;
};

export function MasterDataManager({ entity, singular, title, description, fields, rows, detailBasePath }: Props) {
  const EntityIcon = entityIcons[entity];
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [successMsg, setSuccessMsg] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const tableFields = fields.filter(field => field.table !== false);
  const formFields = fields.filter(field => field.form !== false);
  const filtered = useMemo(() => rows.filter(row => Object.values(row).some(value => String(value ?? "").toLowerCase().includes(query.toLowerCase()))), [rows, query]);
  const close = () => { setEditing(undefined); setMessage(undefined); setDeletingId(null); };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(undefined), 3000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editing !== undefined || deletingId !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing, deletingId]);

  const submit = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const raw = Object.fromEntries(formData) as Record<string, unknown>;
    for (const field of formFields) {
      if (field.type === "multiselect") raw[field.key] = formData.getAll(field.key).map(String);
    }
    setNotice(undefined);
    startTransition(async () => {
      const isNew = !editing?.id;
      const result = await saveMasterData(entity, editing?.id ?? null, raw);
      if (result.error) {
        setMessage(result.error);
      } else {
        close();
        if (result.warning) {
          setNotice(result.warning);
        } else {
          showSuccess(isNew ? `${singular} berhasil ditambahkan!` : `${singular} berhasil diperbarui!`);
        }
      }
    });
  };
  const remove = (id: string) => {
    setDeletingId(id);
  };
  
  const confirmDelete = () => {
    if (!deletingId) return;
    setNotice(undefined);
    startTransition(async () => {
      const result = await deleteMasterData(entity, deletingId);
      if (result.error) setMessage(result.error);
      else if (result.warning) setNotice(result.warning);
      else showSuccess(`${singular} berhasil dihapus.`);
      setDeletingId(null);
    });
  };

  return <>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="app-title-primary">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><button onClick={() => { setEditing(null); setMessage(undefined); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brandHover"><Plus size={17} />Tambah {singular}</button></div>
    {notice && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{notice}</p>}
    {successMsg && (
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <circle cx="8" cy="8" r="8" fill="#10B981" fillOpacity="0.15"/>
          <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {successMsg}
      </div>
    )}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-apple-soft">
      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand/10 text-brand">
              <EntityIcon size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Database {singular}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">{rows.length} data terdaftar</span>
                <span>{filtered.length} tampil</span>
              </div>
            </div>
          </div>
          <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-slate-400 transition focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/10 lg:max-w-md">
            <Search size={17} className="shrink-0" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Cari ${singular.toLowerCase()}...`} className="master-table-search-input min-w-0 flex-1 appearance-none border-none bg-transparent p-0 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none" />
          </label>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:hidden">
        {filtered.map(row => (
          <div key={row.id} className="flex flex-col gap-3 p-4 transition hover:bg-slate-50/70">
            <div className="flex flex-col gap-1">
              {tableFields.map((field, index) => (
                <div key={field.key} className="flex flex-col">
                  {index === 0 ? (
                    <span className="font-semibold text-ink text-base">
                      {field.key === "full_name" && row.student_number ? (
                        <>
                          {display(row[field.key])}
                          <span className="mt-0.5 block text-xs font-semibold text-slate-400">{display(row.student_number)}</span>
                        </>
                      ) : priceFields.has(field.key) && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                    </span>
                  ) : (
                    <div className="flex justify-between items-center text-sm py-0.5">
                      <span className="text-slate-500">{field.label}</span>
                      <span className="text-slate-700 text-right font-medium max-w-[65%]">
                        {field.key === "parent_name" && row.parent_phone ? (
                          <span className="block">
                            <span className="block truncate">{display(row[field.key])}</span>
                            <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{display(row.parent_phone)}</span>
                          </span>
                        ) : field.key === "parent_contact" && row.parent_name ? (
                          <span className="block">
                            <span className="block truncate">{display(row[field.key])}</span>
                            <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{display(row.parent_name)}</span>
                          </span>
                        ) : priceFields.has(field.key) && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              {detailBasePath && (
                <a href={`${detailBasePath}/${row.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#EAF4FF] p-2.5 text-sm font-medium text-[#1688F0] hover:bg-[#DCEEFF] transition">
                  <Eye size={16} /> Detail
                </a>
              )}
              <button onClick={() => { setEditing(row); setMessage(undefined); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#EEF2FF] p-2.5 text-sm font-medium text-[#4F63F6] hover:bg-[#E1E7FF] transition">
                <Pencil size={16} /> Edit
              </button>
              <button onClick={() => { remove(row.id); setMessage(undefined); }} disabled={isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 p-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
              {query ? <SearchX size={22} /> : <EntityIcon size={22} />}
            </span>
            <p className="text-sm font-semibold text-ink">{query ? "Data tidak ditemukan" : `Belum ada ${singular.toLowerCase()}`}</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">{query ? "Coba kata kunci lain atau kosongkan pencarian." : `Tambahkan ${singular.toLowerCase()} pertama agar tabel mulai terisi.`}</p>
            {!query && (
              <button onClick={() => { setEditing(null); setMessage(undefined); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brandHover">
                <Plus size={15} /> Tambah {singular}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="master-table-scroll hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <colgroup>
            {tableFields.map(field => <col key={field.key} style={{ width: tableColumnWidth(field, tableFields.length) }} />)}
            <col style={{ width: detailBasePath ? "170px" : "124px" }} />
          </colgroup>
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[13px] text-slate-500">
            <tr>
              {tableFields.map(field => <th key={field.key} className="px-5 py-3.5 font-semibold">{field.label}</th>)}
              <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map(row => (
              <tr key={row.id} className="group transition hover:bg-[#EAF4FF]">
                {tableFields.map(field => (
                  <td key={field.key} className="max-w-[220px] truncate px-5 py-4 text-slate-600">
                    {field.key === "full_name" && row.student_number ? (
                      <span className="block">
                        <span className="block font-semibold text-ink">{display(row[field.key])}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-400">{display(row.student_number)}</span>
                      </span>
                    ) : field.key === "parent_name" && row.parent_phone ? (
                      <span className="block">
                        <span className="block font-semibold text-ink">{display(row[field.key])}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-400">{display(row.parent_phone)}</span>
                      </span>
                    ) : field.key === "parent_contact" && row.parent_name ? (
                      <span className="block">
                        <span className="block font-semibold text-ink">{display(row[field.key])}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-400">{display(row.parent_name)}</span>
                      </span>
                    ) : priceFields.has(field.key) && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                  </td>
                ))}
                <td className="px-5 py-4">
                  <div className="ml-auto flex w-fit justify-end gap-2">
                    {detailBasePath && <a href={`${detailBasePath}/${row.id}`} className="rounded-xl bg-[#EAF4FF] p-2.5 text-[#1688F0] transition hover:-translate-y-0.5 hover:bg-[#CFE7FF] hover:!text-[#0B74DE]" aria-label="Detail" title="Detail"><Eye size={16} /></a>}
                    <button onClick={() => { setEditing(row); setMessage(undefined); }} className="rounded-xl bg-[#EEF2FF] p-2.5 text-[#4F63F6] transition hover:-translate-y-0.5 hover:bg-[#D8E0FF] hover:!text-[#3547DD]" aria-label="Edit" title="Edit"><Pencil size={16} /></button>
                    <button onClick={() => { remove(row.id); setMessage(undefined); }} disabled={isPending} className="rounded-xl bg-red-50 p-2.5 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 hover:!text-red-700 disabled:opacity-50" aria-label="Hapus" title="Hapus"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={tableFields.length + 1} className="px-5 py-14">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                      {query ? <SearchX size={22} /> : <EntityIcon size={22} />}
                    </span>
                    <p className="text-sm font-semibold text-ink">{query ? "Data tidak ditemukan" : `Belum ada ${singular.toLowerCase()}`}</p>
                    <p className="mt-1 text-xs text-slate-500">{query ? "Coba kata kunci lain atau kosongkan pencarian." : `Tambahkan ${singular.toLowerCase()} pertama agar tabel mulai terisi.`}</p>
                    {!query && (
                      <button onClick={() => { setEditing(null); setMessage(undefined); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brandHover">
                        <Plus size={15} /> Tambah {singular}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
    {mounted && editing !== undefined && createPortal(<div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/40"><div className="flex min-h-full items-end justify-center sm:items-center sm:p-6"><form onSubmit={event => { event.preventDefault(); submit(event.currentTarget); }} className="w-full bg-white p-6 rounded-t-3xl sm:max-w-xl sm:rounded-3xl sm:my-8"><div className="mb-6 flex items-start justify-between"><div><h2 className="app-title-secondary">{editing ? `Edit ${singular}` : `Tambah ${singular}`}</h2><p className="mt-1 text-sm text-slate-500">Lengkapi data berikut dengan benar.</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20}/></button></div>{message && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}<div className="grid gap-4 sm:grid-cols-2">{formFields.map(field => <FieldInput key={field.key} field={field} record={editing}/>)}</div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">{isPending ? "Menyimpan..." : "Simpan Data"}</button></div></form></div></div>, document.body)}
    <ConfirmDialog
      open={deletingId !== null}
      title={`Hapus Data ${singular}?`}
      description="Data yang dihapus tidak dapat dikembalikan. Pastikan data ini memang sudah tidak digunakan."
      isPending={isPending}
      onClose={() => setDeletingId(null)}
      onConfirm={confirmDelete}
    />
  </>;
}

function FieldInput({ field, record }: { field: Field; record: MasterRecord | null }) {
  const defaultValue = String(record?.[field.key] ?? (field.key === "status" ? "active" : ""));
  const selectedValues = new Set(Array.isArray(record?.[field.key]) ? record?.[field.key] as string[] : []);

  const hasAccount = record?.profile_id;
  if (record && hasAccount && field.key === "account_email") {
    return (
      <label>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</span>
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          <span className="flex-1 truncate">{defaultValue || "—"}</span>
          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Terhubung</span>
        </div>
        <input type="hidden" name={field.key} value="" />
      </label>
    );
  }
  if (record && hasAccount && field.key === "account_password") {
    return <input type="hidden" name={field.key} value="" />;
  }

  const className = field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : "";
  const Wrapper = field.type === "multiselect" ? "div" : "label";

  return (
    <Wrapper className={className}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "multiselect" ? (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-2">
          {field.options?.map(option => (
            <label key={option.value} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                name={field.key}
                value={option.value}
                defaultChecked={selectedValues.has(option.value)}
                className="h-4 w-4 accent-[#2563EB]"
              />
              <span>{option.label}</span>
            </label>
          ))}
          {!field.options?.length && <p className="px-2 py-2 text-sm text-slate-500">Data belum tersedia.</p>}
        </div>
      ) : field.type === "textarea" ? (
        <textarea name={field.key} defaultValue={defaultValue} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
      ) : field.type === "select" ? (
        <AppSelect
          name={field.key}
          defaultValue={defaultValue}
          options={field.options ?? []}
          placeholder={field.key !== "status" ? field.key === "subject_id" ? "Semua Mapel" : `Pilih ${field.label}` : ""}
          className="w-full"
        />
      ) : (
        <input
          name={field.key}
          type={field.type ?? "text"}
          defaultValue={defaultValue}
          required={!optionalFields.includes(field.key)}
          step={priceFields.has(field.key) ? "0.01" : undefined}
          autoComplete={
            field.key === "account_password" ? "new-password"
            : field.key === "account_email" ? "off"
            : undefined
          }
          placeholder={
            field.key === "account_email" ? "Masukkan email akun baru"
            : field.key === "account_password" ? "Masukkan password akun baru"
            : undefined
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
      )}
    </Wrapper>
  );
}
