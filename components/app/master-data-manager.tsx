"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { deleteMasterData, saveMasterData, type MasterEntity } from "@/app/admin/master-data/actions";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "password" | "textarea" | "select";
  options?: { value: string; label: string }[];
  table?: boolean;
  form?: boolean;
};
export type MasterRecord = Record<string, string | number | null> & { id: string };

type Props = { entity: MasterEntity; singular: string; title: string; description: string; fields: Field[]; rows: MasterRecord[]; detailBasePath?: string };
const optionalFields = ["address", "description", "birth_date", "school_name", "grade", "parent_id", "package_id", "specialization", "profile_id", "account_email", "account_password"];
const display = (value: string | number | null) => value === null || value === "" ? "—" : typeof value === "number" ? new Intl.NumberFormat("id-ID").format(value) : value;

export function MasterDataManager({ entity, singular, title, description, fields, rows, detailBasePath }: Props) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null | undefined>();
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const tableFields = fields.filter(field => field.table !== false);
  const formFields = fields.filter(field => field.form !== false);
  const filtered = useMemo(() => rows.filter(row => Object.values(row).some(value => String(value ?? "").toLowerCase().includes(query.toLowerCase()))), [rows, query]);
  const close = () => { setEditing(undefined); setMessage(undefined); };
  const submit = (form: HTMLFormElement) => {
    const raw = Object.fromEntries(new FormData(form));
    startTransition(async () => {
      const result = await saveMasterData(entity, editing?.id ?? null, raw);
      if (result.error) setMessage(result.error); else close();
    });
  };
  const remove = (id: string) => {
    if (!window.confirm(`Hapus data ${singular.toLowerCase()} ini?`)) return;
    startTransition(async () => {
      const result = await deleteMasterData(entity, id);
      if (result.error) setMessage(result.error);
    });
  };

  return <>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="app-title-primary">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><button onClick={() => setEditing(null)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brandHover"><Plus size={17} />Tambah {singular}</button></div>
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-apple-soft">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">{rows.length} data terdaftar</p>
        <label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 focus-within:border-brand/50 focus-within:bg-white">
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Cari ${singular.toLowerCase()}...`} className="w-full bg-transparent text-sm text-ink outline-none" />
        </label>
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
                      {field.key === "price" && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                    </span>
                  ) : (
                    <div className="flex justify-between items-center text-sm py-0.5">
                      <span className="text-slate-500">{field.label}</span>
                      <span className="text-slate-700 text-right font-medium max-w-[65%] truncate">
                        {field.key === "price" && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              {detailBasePath && (
                <a href={`${detailBasePath}/${row.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 p-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition">
                  <Eye size={16} /> Detail
                </a>
              )}
              <button onClick={() => setEditing(row)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand/10 p-2.5 text-sm font-medium text-brand hover:bg-brand/20 transition">
                <Pencil size={16} /> Edit
              </button>
              <button onClick={() => remove(row.id)} disabled={isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 p-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Belum ada data yang cocok.</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {tableFields.map(field => <th key={field.key} className="px-5 py-3 font-semibold">{field.label}</th>)}
              <th className="px-5 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(row => (
              <tr key={row.id} className="transition hover:bg-slate-50/70">
                {tableFields.map(field => (
                  <td key={field.key} className="max-w-[220px] truncate px-5 py-4 text-slate-600">
                    {field.key === "price" && row[field.key] !== null ? `Rp ${display(row[field.key])}` : display(row[field.key])}
                  </td>
                ))}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {detailBasePath && <a href={`${detailBasePath}/${row.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-brand/10 hover:text-brand" aria-label="Detail"><Eye size={17} /></a>}
                    <button onClick={() => setEditing(row)} className="rounded-lg p-2 text-slate-400 hover:bg-brand/10 hover:text-brand" aria-label="Edit"><Pencil size={17} /></button>
                    <button onClick={() => remove(row.id)} disabled={isPending} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="Hapus"><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={tableFields.length + 1} className="px-5 py-12 text-center text-slate-500">Belum ada data yang cocok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
    {editing !== undefined && <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/30 backdrop-blur-sm"><div className="flex min-h-full items-end justify-center sm:items-center sm:p-6"><form onSubmit={event => { event.preventDefault(); submit(event.currentTarget); }} className="w-full bg-white p-6 shadow-2xl rounded-t-3xl sm:max-w-xl sm:rounded-3xl sm:my-8"><div className="mb-6 flex items-start justify-between"><div><h2 className="app-title-secondary">{editing ? `Edit ${singular}` : `Tambah ${singular}`}</h2><p className="mt-1 text-sm text-slate-500">Lengkapi data berikut dengan benar.</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20}/></button></div>{message && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}<div className="grid gap-4 sm:grid-cols-2">{formFields.map(field => <FieldInput key={field.key} field={field} record={editing}/>)}</div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">{isPending ? "Menyimpan..." : "Simpan Data"}</button></div></form></div></div>}
  </>;
}

function FieldInput({ field, record }: { field: Field; record: MasterRecord | null }) {
  const defaultValue = String(record?.[field.key] ?? "");

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

  return (
    <label className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea name={field.key} defaultValue={defaultValue} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
      ) : field.type === "select" ? (
        <select name={field.key} defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
          <option value="">Pilih {field.label}</option>
          {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          name={field.key}
          type={field.type ?? "text"}
          defaultValue={defaultValue}
          required={!optionalFields.includes(field.key)}
          step={field.key === "price" ? "0.01" : undefined}
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
    </label>
  );
}
