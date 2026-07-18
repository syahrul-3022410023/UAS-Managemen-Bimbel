"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { deleteSchedule, generateSchedules, saveSchedule } from "@/app/admin/kelas/actions";

type Schedule = { id: string; class_id: string; mentor_id: string; starts_at: string; ends_at: string; room: string | null; notes: string | null; class_name: string; mentor_name: string; subject_name?: string; package_name?: string; student_names?: string[]; status_label?: string };
type Props = { schedules: Schedule[]; classes: { id: string; name: string }[]; mentors: { id: string; full_name: string }[] };
type PatternDraft = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weekdays: string[];
};

const weekdayOptions = [
  { value: "1", label: "Sen" },
  { value: "2", label: "Sel" },
  { value: "3", label: "Rab" },
  { value: "4", label: "Kam" },
  { value: "5", label: "Jum" },
  { value: "6", label: "Sab" },
  { value: "0", label: "Min" },
];

export function ScheduleCalendar({ schedules, classes, mentors }: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const [mounted, setMounted] = useState(false);
  const [viewTitle, setViewTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  
  const [editing, setEditing] = useState<Schedule | null | undefined>(); 
  const [patternOpen, setPatternOpen] = useState(false);
  const [message, setMessage] = useState<string>(); 
  const [patternMessage, setPatternMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [patternDraft, setPatternDraft] = useState<PatternDraft>({
    startDate: "",
    endDate: "",
    startTime: "16:00",
    endTime: "18:00",
    weekdays: ["1", "3"],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editing !== undefined || patternOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing, patternOpen]);
  
  const getEventColorStyle = (classId: string) => {
    const hash = classId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: "#FFE4E6", border: "#E11D48", text: "#E11D48" }, // pink/red
      { bg: "#FEF3C7", border: "#D97706", text: "#D97706" }, // yellow/orange
      { bg: "#F3E8FF", border: "#9333EA", text: "#9333EA" }, // purple
      { bg: "#E0E7FF", border: "#4F46E5", text: "#4F46E5" }, // indigo
      { bg: "#D1FAE5", border: "#059669", text: "#059669" }, // emerald
    ];
    return colors[hash % colors.length];
  };

  const events = useMemo(() => schedules.map(x => {
    const colors = getEventColorStyle(x.class_id);
    return {
      id: x.id, 
      title: `${x.class_name}`, 
      start: x.starts_at, 
      end: x.ends_at, 
      extendedProps: { schedule: x, colors }
    };
  }), [schedules]);

  const formSchedule = editing ?? { id: "", class_id: "", mentor_id: "", starts_at: "", ends_at: "", room: null, notes: null, class_name: "", mentor_name: "" };
  
  const close = () => { setEditing(undefined); setMessage(undefined); };
  const closePattern = () => { setPatternOpen(false); setPatternMessage(undefined); };

  const patternSlots = useMemo(() => buildPatternSlots(patternDraft), [patternDraft]);
  
  const submit = (form: HTMLFormElement) => startTransition(async () => { 
    const formData = new FormData(form);
    
    // Konversi nilai datetime-local (yang tanpa zona waktu) ke format ISO penuh
    // agar Supabase menyimpan waktu lokal dengan benar (tidak menganggapnya UTC).
    const startStr = formData.get("starts_at") as string;
    const endStr = formData.get("ends_at") as string;
    if (startStr) formData.set("starts_at", new Date(startStr).toISOString());
    if (endStr) formData.set("ends_at", new Date(endStr).toISOString());

    const result = await saveSchedule(editing?.id ?? null, Object.fromEntries(formData)); 
    if (result.error) setMessage(result.error); else close(); 
  });
  
  const remove = () => { 
    if (!editing || !window.confirm("Hapus jadwal ini?")) return; 
    startTransition(async () => { 
      const result = await deleteSchedule(editing.id); 
      if (result.error) setMessage(result.error); else close(); 
    }); 
  };

  const submitPattern = (form: HTMLFormElement) => startTransition(async () => {
    const formData = new FormData(form);
    const slots = buildPatternSlots(patternDraft);
    if (!slots.length) {
      setPatternMessage("Pilih periode, hari, dan jam yang benar.");
      return;
    }

    const result = await generateSchedules({
      class_id: formData.get("class_id"),
      mentor_id: formData.get("mentor_id"),
      room: formData.get("room"),
      notes: formData.get("notes"),
      slots,
    });
    if (result.error) setPatternMessage(result.error);
    else closePattern();
  });

  const handleDatesSet = (arg: any) => {
    setViewTitle(arg.view.title);
    setActiveView(arg.view.type);
  };

  const changeView = (viewName: string) => {
    if (calendarRef.current) calendarRef.current.getApi().changeView(viewName);
  };

  const nav = (action: "prev" | "next") => {
    if (calendarRef.current) {
      if (action === "prev") calendarRef.current.getApi().prev();
      else calendarRef.current.getApi().next();
    }
  };

  const formatTime = (iso: string) => {
    return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).replace(".", ":");
  };

  const renderEventContent = (eventInfo: any) => {
    const { colors, schedule } = eventInfo.event.extendedProps;
    return (
      <div 
        className="relative w-full h-full rounded-xl px-2 py-1.5 overflow-hidden font-sans flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]" 
        style={{ backgroundColor: colors.bg }}
      >
        {/* Indikator bar kecil di sebelah kanan sesuai referensi GSM */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-l-full" style={{ backgroundColor: colors.border }} />
        
        <p className="text-[11px] font-bold truncate w-full" style={{ color: colors.text }}>
          {schedule.class_name}
        </p>
        <p className="text-[10px] truncate w-full font-medium mt-0.5" style={{ color: colors.text }}>
          {schedule.mentor_name}
        </p>
        <p className="text-[9px] truncate w-full opacity-80 font-medium mt-0.5" style={{ color: colors.text }}>
          {formatTime(schedule.starts_at)} - {formatTime(schedule.ends_at)}
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-5">
        {/* View Segmented Control */}
        <div className="flex bg-brand/5 p-1 rounded-xl w-max">
          <button 
            onClick={() => changeView("dayGridMonth")} 
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${activeView === "dayGridMonth" ? "bg-brand text-white" : "text-brand hover:bg-brand/10"}`}
          >
            Month
          </button>
          <button 
            onClick={() => changeView("timeGridDay")} 
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${activeView === "timeGridDay" ? "bg-brand text-white" : "text-brand hover:bg-brand/10"}`}
          >
            Day
          </button>
        </div>
        
        {/* Title, Nav, and Add Button */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-ink min-w-[200px]">{viewTitle}</h2>
            <div className="flex items-center gap-1.5">
              <button onClick={() => nav("prev")} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brandHover transition">
                <ChevronLeft size={20} strokeWidth={2.5}/>
              </button>
              <button onClick={() => nav("next")} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brandHover transition">
                <ChevronRight size={20} strokeWidth={2.5}/>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPatternOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-[#EEF0FF] px-5 py-2.5 text-sm font-bold text-brand transition hover:border-brand/30 hover:bg-[#E4E7FF]"
            >
              <CalendarPlus size={18} strokeWidth={2.5} /> Pola Mingguan
            </button>
            <button onClick={() => setEditing(null)} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brandHover transition">
              <Plus size={18} strokeWidth={2.5}/> Tambah Manual
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 custom-calendar">
        <FullCalendar 
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} 
          initialView="dayGridMonth" 
          headerToolbar={false}
          locale="id" 
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          firstDay={1} 
          allDaySlot={false} 
          slotMinTime="06:00:00" 
          slotMaxTime="22:00:00" 
          height="auto" 
          events={events} 
          eventContent={renderEventContent}
          datesSet={handleDatesSet}
          eventClick={(event: EventClickArg) => setEditing(event.event.extendedProps.schedule as Schedule)} 
          select={(info: DateSelectArg) => setEditing({ id: "", class_id: "", mentor_id: "", starts_at: info.startStr, ends_at: info.endStr, room: null, notes: null, class_name: "", mentor_name: "" })} 
          selectable
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-ink">Daftar Jadwal</h3>
          <p className="mt-1 text-xs text-slate-500">Detail siswa, mentor, paket bimbel, mapel, hari, jam, dan status.</p>
        </div>
        <div className="divide-y divide-slate-100 sm:hidden">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-ink">{schedule.subject_name ?? schedule.class_name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">{formatDay(schedule.starts_at)}, {formatTime(schedule.starts_at)} - {formatTime(schedule.ends_at)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{schedule.status_label ?? "Terjadwal"}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <MobileInfo label="Mentor" value={schedule.mentor_name} />
                <MobileInfo label="Paket" value={schedule.package_name ?? "-"} />
                <MobileInfo label="Siswa" value={schedule.student_names?.length ? schedule.student_names.join(", ") : "-"} />
              </div>
            </article>
          ))}
          {schedules.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">Belum ada jadwal.</div>}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Nama Siswa</th>
                <th className="px-5 py-3 font-semibold">Mentor</th>
                <th className="px-5 py-3 font-semibold">Paket Bimbel</th>
                <th className="px-5 py-3 font-semibold">Mata Pelajaran</th>
                <th className="px-5 py-3 font-semibold">Hari</th>
                <th className="px-5 py-3 font-semibold">Jam</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="transition hover:bg-slate-50/70">
                  <td className="max-w-[240px] px-5 py-4 text-slate-600">{schedule.student_names?.length ? schedule.student_names.join(", ") : "-"}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{schedule.mentor_name}</td>
                  <td className="px-5 py-4 text-slate-600">{schedule.package_name ?? "-"}</td>
                  <td className="px-5 py-4 text-slate-600">{schedule.subject_name ?? schedule.class_name}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDay(schedule.starts_at)}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{formatTime(schedule.starts_at)} - {formatTime(schedule.ends_at)}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{schedule.status_label ?? "Terjadwal"}</span></td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Belum ada jadwal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mounted && editing !== undefined && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end bg-slate-900/40 sm:items-center sm:justify-center sm:p-6">
          <form onSubmit={event => { event.preventDefault(); submit(event.currentTarget); }} className="w-full rounded-t-3xl bg-white p-6 sm:max-w-xl sm:rounded-3xl">
            <div className="mb-6 flex justify-between">
              <div>
                <h2 className="app-title-secondary">{formSchedule.id ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
                <p className="mt-1 text-sm text-slate-500">Kelas dan mentor tidak boleh memiliki waktu yang bertabrakan.</p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X/></button>
            </div>
            {message && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Label text="Kelas">
                <select name="class_id" required defaultValue={formSchedule.class_id} className="input">
                  <option value="">Pilih kelas</option>
                  {classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </Label>
              <Label text="Mentor">
                <select name="mentor_id" required defaultValue={formSchedule.mentor_id} className="input">
                  <option value="">Pilih mentor</option>
                  {mentors.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                </select>
              </Label>
              <Label text="Mulai">
                <input name="starts_at" type="datetime-local" required defaultValue={localDateTime(formSchedule.starts_at)} className="input"/>
              </Label>
              <Label text="Selesai">
                <input name="ends_at" type="datetime-local" required defaultValue={localDateTime(formSchedule.ends_at)} className="input"/>
              </Label>
              <Label text="Ruangan">
                <input name="room" defaultValue={formSchedule.room ?? ""} className="input"/>
              </Label>
              <Label text="Catatan">
                <input name="notes" defaultValue={formSchedule.notes ?? ""} className="input"/>
              </Label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              {formSchedule.id && (
                <button type="button" onClick={remove} disabled={isPending} className="mr-auto inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 size={16}/>Hapus
                </button>
              )}
              <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
              <button disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isPending ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {mounted && patternOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end bg-slate-900/40 sm:items-center sm:justify-center sm:p-6">
          <form onSubmit={event => { event.preventDefault(); submitPattern(event.currentTarget); }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-3xl sm:rounded-3xl">
            <div className="mb-6 flex justify-between gap-4">
              <div>
                <h2 className="app-title-secondary">Buat Pola Jadwal</h2>
                <p className="mt-1 text-sm text-slate-500">Buat jadwal sekolah berulang tanpa input sesi satu per satu.</p>
              </div>
              <button type="button" onClick={closePattern} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X/></button>
            </div>

            {patternMessage && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{patternMessage}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Label text="Kelas">
                <select name="class_id" required className="input">
                  <option value="">Pilih kelas</option>
                  {classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </Label>
              <Label text="Mentor">
                <select name="mentor_id" required className="input">
                  <option value="">Pilih mentor</option>
                  {mentors.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                </select>
              </Label>

              <Label text="Mulai Periode">
                <input
                  type="date"
                  required
                  value={patternDraft.startDate}
                  onChange={(event) => setPatternDraft((draft) => ({ ...draft, startDate: event.target.value }))}
                  className="input"
                />
              </Label>
              <div>
                <Label text="Akhir Periode">
                  <input
                    type="date"
                    required
                    value={patternDraft.endDate}
                    onChange={(event) => setPatternDraft((draft) => ({ ...draft, endDate: event.target.value }))}
                    className="input"
                  />
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 3, 6].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setPatternDraft((draft) => applyMonthPreset(draft, months))}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:bg-[#EEF0FF] hover:text-brand"
                    >
                      {months} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <Label text="Jam Mulai">
                <input
                  type="time"
                  required
                  value={patternDraft.startTime}
                  onChange={(event) => setPatternDraft((draft) => ({ ...draft, startTime: event.target.value }))}
                  className="input"
                />
              </Label>
              <Label text="Jam Selesai">
                <input
                  type="time"
                  required
                  value={patternDraft.endTime}
                  onChange={(event) => setPatternDraft((draft) => ({ ...draft, endTime: event.target.value }))}
                  className="input"
                />
              </Label>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Hari Belajar</span>
                <div className="flex flex-wrap gap-2">
                  {weekdayOptions.map((day) => {
                    const checked = patternDraft.weekdays.includes(day.value);
                    return (
                      <label key={day.value} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${checked ? "border-brand/30 bg-[#EEF0FF] text-brand" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setPatternDraft((draft) => ({
                            ...draft,
                            weekdays: checked
                              ? draft.weekdays.filter((value) => value !== day.value)
                              : [...draft.weekdays, day.value],
                          }))}
                          className="h-4 w-4 accent-[#3947FF]"
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <Label text="Ruangan">
                <input name="room" className="input" placeholder="Opsional" />
              </Label>
              <Label text="Catatan">
                <input name="notes" className="input" placeholder="Opsional" />
              </Label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold text-ink">Preview</p>
              <p className="mt-1 text-sm text-slate-500">
                Sistem akan membuat <span className="font-bold text-brand">{patternSlots.length}</span> sesi dari pola ini.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Untuk jadwal bulanan, pilih tanggal mulai lalu klik preset 1 Bulan.
              </p>
              {patternSlots.length > 120 && (
                <p className="mt-1 text-xs font-semibold text-red-600">Maksimal 120 sesi per generate. Perpendek periode dulu.</p>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={closePattern} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
              <button disabled={isPending || patternSlots.length === 0 || patternSlots.length > 120} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">
                {isPending ? "Membuat..." : "Generate Jadwal"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { 
  return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{text}</span>{children}</label>; 
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-600">{value}</span>
    </div>
  );
}

function localDateTime(value: string) { 
  if (!value) return ""; 
  const date = new Date(value); 
  const offset = date.getTimezoneOffset(); 
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); 
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date(iso));
}

function buildPatternSlots(draft: PatternDraft) {
  if (!draft.startDate || !draft.endDate || !draft.startTime || !draft.endTime || draft.weekdays.length === 0) return [];

  const start = new Date(`${draft.startDate}T00:00:00`);
  const end = new Date(`${draft.endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  if (draft.endTime <= draft.startTime) return [];

  const weekdays = new Set(draft.weekdays.map(Number));
  const slots: { starts_at: string; ends_at: string }[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    if (weekdays.has(cursor.getDay())) {
      const date = toDateInputValue(cursor);
      slots.push({
        starts_at: new Date(`${date}T${draft.startTime}:00`).toISOString(),
        ends_at: new Date(`${date}T${draft.endTime}:00`).toISOString(),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function applyMonthPreset(draft: PatternDraft, months: number): PatternDraft {
  const startDate = draft.startDate || toDateInputValue(new Date());
  const start = new Date(`${startDate}T00:00:00`);
  const end = addMonthsClamped(start, months);
  end.setDate(end.getDate() - 1);

  return {
    ...draft,
    startDate,
    endDate: toDateInputValue(end),
  };
}

function addMonthsClamped(date: Date, months: number) {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const targetLastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), targetLastDay);
  return new Date(year, month, day);
}
