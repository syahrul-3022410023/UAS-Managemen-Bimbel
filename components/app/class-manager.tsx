"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteClass, saveClass } from "@/app/admin/kelas/actions";
import type { ClassRow, Option, PersonOption } from "@/app/admin/kelas/page-data";
import { ConfirmDialog } from "./confirm-dialog";

type Props = {
  rows: ClassRow[];
  packages: Option[];
  mentors: PersonOption[];
};
type Editing = ClassRow | null | undefined;

export function ClassManager({ rows, packages, mentors }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState<Editing>();
  const [message, setMessage] = useState<string>();
  const [packageFilter, setPackageFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = editing !== undefined || deletingId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing, deletingId]);

  const close = () => {
    setEditing(undefined);
    setMessage(undefined);
  };

  const submit = (form: HTMLFormElement) =>
    startTransition(async () => {
      const formData = new FormData(form);
      const result = await saveClass(editing?.id ?? null, {
        ...Object.fromEntries(formData),
        mentor_ids: formData.getAll("mentor_ids"),
      });
      if (result.error) setMessage(result.error);
      else {
        close();
        router.refresh();
      }
    });

  const remove = (id: string) => {
    setDeletingId(id);
  };

  const confirmRemove = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteClass(deletingId);
      if (result.error) setMessage(result.error);
      else {
        setDeletingId(null);
        router.refresh();
      }
    });
  };

  const visibleRows = packageFilter
    ? rows.filter((row) => row.package_groups.some((group) => group.id === packageFilter))
    : rows;

  return (
    <div className="class-manager-page">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="app-title-primary">Program & Kelas Bimbel</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">Kelas berisi mentor dan jadwal. Siswa otomatis mengikuti paket orang tua.</p>
        </div>
      </div>

      <div className="class-manager-rail w-full">
        <button onClick={() => setEditing(null)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brandHover sm:w-auto sm:px-4">
          <Plus size={17} /> Tambah Kelas
        </button>

        <div className="class-filter-grid mb-6 mt-7 grid grid-cols-2 gap-3 sm:mb-5 sm:mt-5 sm:flex sm:flex-wrap">
          <button
            onClick={() => setPackageFilter("")}
            className={`min-h-10 w-full rounded-lg px-3 py-2 text-center text-xs font-medium transition sm:w-auto ${!packageFilter ? "bg-brand/10 text-brand ring-1 ring-brand/20" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            Semua Paket
          </button>
          {packages.map((item) => (
            <button
              key={item.id}
              onClick={() => setPackageFilter(item.id)}
              className={`min-h-10 w-full rounded-lg px-3 py-2 text-center text-xs font-medium transition sm:w-auto ${packageFilter === item.id ? "bg-brand/10 text-brand ring-1 ring-brand/20" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="class-card-grid hidden gap-4 sm:grid sm:gap-5 xl:grid-cols-2">
          {visibleRows.map((row) => (
            <article key={row.id} className="class-card w-full justify-self-stretch overflow-hidden rounded-xl border border-slate-100 bg-white shadow-apple-soft">
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {row.package_names.length ? row.package_names.map((name) => (
                        <span key={name} className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{name}</span>
                      )) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Belum masuk paket</span>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-bold leading-tight text-ink sm:mt-1 sm:truncate sm:text-lg">{row.name}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 sm:mt-2">
                      <span className="mr-1 shrink-0 text-slate-600">Mentor:</span>
                      {row.mentor_names.length ? row.mentor_names.map((name) => (
                        <span key={name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{name}</span>
                      )) : (
                        <span>Belum ada mentor</span>
                      )}
                    </div>
                  </div>
                  <div className="hidden shrink-0 sm:flex">
                    <button onClick={() => setEditing(row)} className="rounded-lg p-2 text-slate-400 hover:bg-brand/10 hover:text-brand" aria-label="Edit kelas">
                      <Pencil size={17} />
                    </button>
                    <button onClick={() => remove(row.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus kelas">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Metric label="Siswa" value={`${row.student_ids.length}/${row.capacity}`} />
                  <Metric label="Fee" value={formatShortCurrency(row.mentor_fee_per_session)} />
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">Siswa otomatis dari paket</p>
                  <PackageGroups groups={packageFilter ? row.package_groups.filter((group) => group.id === packageFilter) : row.package_groups} fallbackNames={row.student_names} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2 sm:hidden">
                <button onClick={() => setEditing(row)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-brand/10 hover:text-brand" aria-label="Edit kelas">
                  <Pencil size={17} />
                </button>
                <button onClick={() => remove(row.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Hapus kelas">
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}

          {visibleRows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand/25 bg-[#FAFCFF] p-12 text-center font-medium text-[#55708F] lg:col-span-2">
              {packageFilter ? "Belum ada kelas di paket ini." : "Belum ada kelas. Tambahkan kelas pertama untuk memulai."}
            </div>
          )}
        </div>

        <div className="class-mobile-list sm:hidden">
          {visibleRows.map((row) => (
            <article key={row.id} className="class-mobile-card">
              <div className="class-mobile-card-body">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {row.package_names.length ? row.package_names.map((name) => (
                    <span key={name} className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{name}</span>
                  )) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Belum masuk paket</span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-bold leading-tight text-ink">{row.name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                  <span className="mr-1 shrink-0 text-slate-600">Mentor:</span>
                  {row.mentor_names.length ? row.mentor_names.map((name) => (
                    <span key={name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{name}</span>
                  )) : (
                    <span>Belum ada mentor</span>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Metric label="Siswa" value={`${row.student_ids.length}/${row.capacity}`} />
                  <Metric label="Fee" value={formatShortCurrency(row.mentor_fee_per_session)} />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">Siswa otomatis dari paket</p>
                  <PackageGroups groups={packageFilter ? row.package_groups.filter((group) => group.id === packageFilter) : row.package_groups} fallbackNames={row.student_names} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                <button onClick={() => setEditing(row)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-brand/10 hover:text-brand" aria-label="Edit kelas">
                  <Pencil size={17} />
                </button>
                <button onClick={() => remove(row.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Hapus kelas">
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}

          {visibleRows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand/25 bg-[#FAFCFF] p-8 text-center font-medium text-[#55708F]">
              {packageFilter ? "Belum ada kelas di paket ini." : "Belum ada kelas. Tambahkan kelas pertama untuk memulai."}
            </div>
          )}
        </div>
      </div>

      {mounted && editing !== undefined && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end bg-slate-900/40 sm:items-center sm:justify-center sm:p-6">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-3xl sm:rounded-3xl">
            <div className="mb-6 flex justify-between">
              <div>
                <h2 className="app-title-secondary">{editing ? "Kelola Kelas" : "Tambah Kelas"}</h2>
                <p className="mt-1 text-sm text-slate-500">Tentukan informasi kelas dan penempatannya.</p>
              </div>
              <button onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Tutup modal">
                <X />
              </button>
            </div>

            {message && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}

            <form onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget); }} className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Kelas">
                <input name="name" required defaultValue={editing?.name ?? ""} placeholder="Contoh: Matematika SD" className="input" />
              </Field>
              <Field label="Kapasitas">
                <input name="capacity" type="number" min="1" required defaultValue={editing?.capacity ?? 20} className="input" />
              </Field>
              <Field label="Mentor">
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                  {mentors.map((mentor) => {
                    const disabled = !mentor.profile_id;
                    return (
                      <label key={mentor.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${disabled ? "text-slate-400" : "text-slate-700 hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          name="mentor_ids"
                          value={mentor.id}
                          defaultChecked={editing?.mentor_ids.includes(mentor.id) ?? false}
                          disabled={disabled}
                          className="h-4 w-4 accent-[#2563EB]"
                        />
                        <span className="min-w-0 truncate">{mentor.full_name}{disabled ? " - belum punya akun" : ""}</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
              <Field label="Gaji Mentor/Sesi">
                <input name="mentor_fee_per_session" type="text" required defaultValue={editing?.mentor_fee_per_session ?? 0} className="input" />
              </Field>
              <Field label="Deskripsi">
                <input name="description" defaultValue={editing?.description ?? ""} className="input" />
              </Field>
              <div className="flex justify-end gap-3 sm:col-span-2">
                <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
                <button disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isPending ? "Menyimpan..." : "Simpan Kelas"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <ConfirmDialog
        open={deletingId !== null}
        title="Hapus Kelas?"
        description="Kelas, penempatan siswa, mentor, dan jadwal terkait akan ikut terhapus."
        isPending={isPending}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-ink">{value}</p>
    </div>
  );
}

function PackageGroups({ groups, fallbackNames }: { groups: { id: string; name: string; student_names: string[] }[]; fallbackNames: string[] }) {
  if (groups.length) {
    return (
      <div className="mt-2 space-y-2">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-600">{group.name}</span>
              <span className="font-bold text-brand">{group.student_names.length} siswa</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{group.student_names.length ? group.student_names.join(", ") : "Belum ada siswa dari paket ini."}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{fallbackNames.length ? fallbackNames.join(", ") : "Belum ada siswa di kelas ini."}</p>
  );
}

function formatShortCurrency(amount: number) {
  if (amount >= 1000000) return `${Math.round(amount / 1000000)} jt`;
  if (amount >= 1000) return `${Math.round(amount / 1000)} rb`;
  return String(amount);
}
