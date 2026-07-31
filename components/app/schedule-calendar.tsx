"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { deleteSchedule, generateSchedules, saveSchedule } from "@/app/admin/kelas/actions";
import { EmptyState, EmptyStateRow } from "./empty-state";
import { DataTableShell } from "./data-table-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { AppSelect } from "./app-select";

type Schedule = { id: string; class_id: string; package_id?: string | null; mentor_id: string; starts_at: string; ends_at: string; room: string | null; notes: string | null; class_name: string; mentor_name: string; subject_name?: string; package_name?: string; student_names?: string[]; status_label?: string };
type ClassOption = { id: string; name: string; mentor_ids?: string[]; packages?: { id: string; name: string }[] };
type Props = { schedules: Schedule[]; classes: ClassOption[]; mentors: { id: string; full_name: string }[] };
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
  const searchParams = useSearchParams();
  const selectedClassId = searchParams.get("classId") ?? "";
  const calendarRef = useRef<FullCalendar>(null);
  const [mounted, setMounted] = useState(false);
  const [viewTitle, setViewTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  
  const [editing, setEditing] = useState<Schedule | null | undefined>(); 
  const [patternOpen, setPatternOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string>(); 
  const [patternMessage, setPatternMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [manualClassId, setManualClassId] = useState("");
  const [manualPackageId, setManualPackageId] = useState("");
  const [manualMentorId, setManualMentorId] = useState("");
  const [patternClassId, setPatternClassId] = useState("");
  const [patternPackageId, setPatternPackageId] = useState("");
  const [patternMentorId, setPatternMentorId] = useState("");
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
    if (editing !== undefined) {
      setManualClassId(editing?.class_id ?? "");
      setManualPackageId(editing?.package_id ?? "");
      setManualMentorId(editing?.mentor_id ?? "");
    }
  }, [editing]);

  useEffect(() => {
    if (editing !== undefined || patternOpen || deleteOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing, patternOpen, deleteOpen]);
  
  const getEventColorStyle = (classId: string) => {
    const hash = classId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: "#EEF6FF", border: "#2F80ED", text: "#1D4ED8" },
      { bg: "#F2F7FF", border: "#38BDF8", text: "#0369A1" },
      { bg: "#F4F2FF", border: "#8B5CF6", text: "#6D28D9" },
      { bg: "#ECFDF5", border: "#10B981", text: "#047857" },
      { bg: "#FFF7ED", border: "#FB923C", text: "#C2410C" },
    ];
    return colors[hash % colors.length];
  };

  const classFilteredSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        if (selectedClassId && schedule.class_id !== selectedClassId) return false;
        return true;
      }),
    [schedules, selectedClassId]
  );

  const visibleSchedules = classFilteredSchedules;

  const initialCalendarDate = useMemo(() => {
    const first = [...classFilteredSchedules].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
    return first?.starts_at;
  }, [classFilteredSchedules]);

  const events = useMemo(() => visibleSchedules.map(x => {
    const title = scheduleTitle(x);
    const colors = getEventColorStyle(x.class_id || title);
    return {
      id: x.id, 
      title, 
      start: x.starts_at, 
      end: x.ends_at, 
      extendedProps: { schedule: x, colors, title }
    };
  }), [visibleSchedules]);

  const formSchedule = editing ?? { id: "", class_id: "", package_id: "", mentor_id: "", starts_at: "", ends_at: "", room: null, notes: null, class_name: "", mentor_name: "" };
  
  const close = () => { setEditing(undefined); setMessage(undefined); setDeleteOpen(false); };
  const closePattern = () => { setPatternOpen(false); setPatternMessage(undefined); setPatternClassId(""); setPatternPackageId(""); setPatternMentorId(""); };

  const patternSlots = useMemo(() => buildPatternSlots(patternDraft), [patternDraft]);
  const mentorNameById = useMemo(() => new Map(mentors.map((mentor) => [mentor.id, mentor.full_name])), [mentors]);
  const manualClass = classes.find((item) => item.id === manualClassId);
  const patternClass = classes.find((item) => item.id === patternClassId);
  const manualPackages = manualClass?.packages ?? [];
  const patternPackages = patternClass?.packages ?? [];
  const manualMentorOptions = getClassMentorOptions(manualClass, mentorNameById);
  const patternMentorOptions = getClassMentorOptions(patternClass, mentorNameById);

  useEffect(() => {
    const mentorIds = manualClass?.mentor_ids ?? [];
    if (!manualClass) {
      setManualMentorId("");
      return;
    }
    if (!mentorIds.length) {
      setManualMentorId("");
      return;
    }
    if (!manualMentorId || !mentorIds.includes(manualMentorId)) {
      setManualMentorId(mentorIds[0]);
    }
  }, [manualClass, manualMentorId]);

  useEffect(() => {
    const mentorIds = patternClass?.mentor_ids ?? [];
    if (!patternClass) {
      setPatternMentorId("");
      return;
    }
    if (!mentorIds.length) {
      setPatternMentorId("");
      return;
    }
    if (!patternMentorId || !mentorIds.includes(patternMentorId)) {
      setPatternMentorId(mentorIds[0]);
    }
  }, [patternClass, patternMentorId]);
  
  const submit = (form: HTMLFormElement) => startTransition(async () => { 
    const formData = new FormData(form);
    if (!formData.get("mentor_id")) {
      setMessage("Kelas ini belum memiliki mentor. Tambahkan mentor di menu Kelas dulu.");
      return;
    }
    
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
    if (!editing) return;
    setDeleteOpen(true);
  };

  const confirmRemove = () => {
    if (!editing?.id) return;
    startTransition(async () => { 
      const result = await deleteSchedule(editing.id); 
      if (result.error) setMessage(result.error); else close(); 
    }); 
  };

  const submitPattern = (form: HTMLFormElement) => startTransition(async () => {
    const formData = new FormData(form);
    if (!formData.get("mentor_id")) {
      setPatternMessage("Kelas ini belum memiliki mentor. Tambahkan mentor di menu Kelas dulu.");
      return;
    }
    const slots = buildPatternSlots(patternDraft);
    if (!slots.length) {
      setPatternMessage("Pilih periode, hari, dan jam yang benar.");
      return;
    }

    const result = await generateSchedules({
      class_id: formData.get("class_id"),
      package_id: formData.get("package_id"),
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

  const changeView = (viewName: "dayGridMonth" | "timeGridDay") => {
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
    const { colors, schedule, title } = eventInfo.event.extendedProps;
    const detail = [schedule.mentor_name, schedule.package_name].filter((value) => value && value !== "-").join(" - ");
    return (
      <div 
        className="schedule-event-pill group relative flex w-full items-center gap-1.5 overflow-hidden rounded-sm px-2 text-left transition hover:brightness-[0.98]" 
        style={{ backgroundColor: colors.bg }}
        title={`${title}${detail ? ` - ${detail}` : ""} ${formatTime(schedule.starts_at)} - ${formatTime(schedule.ends_at)}`}
      >
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.border }} />
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-semibold leading-tight" style={{ color: colors.text }}>
            {title}
          </span>
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Kalender Jadwal</h2>
          <p className="mt-0.5 text-sm text-slate-500">Atur jadwal kelas, mentor, dan paket dalam satu tampilan.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => {
              setPatternClassId(selectedClassId);
              setPatternPackageId("");
              setPatternOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-[#EEF0FF] px-4 py-2 text-sm font-bold text-brand transition hover:border-brand/30 hover:bg-[#E4E7FF]"
          >
            <CalendarPlus size={17} strokeWidth={2.5} /> Pola Mingguan
          </button>
          <button onClick={() => setEditing(selectedClassId ? { id: "", class_id: selectedClassId, package_id: "", mentor_id: "", starts_at: "", ends_at: "", room: null, notes: null, class_name: "", mentor_name: "" } : null)} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brandHover transition">
            <Plus size={17} strokeWidth={2.5}/> Tambah Manual
          </button>
        </div>
      </div>

      <section className={`shadcn-schedule-calendar ${activeView === "timeGridDay" ? "schedule-day-view" : "schedule-month-view"} rounded-2xl bg-white p-3 sm:p-4`}>
        <div className="schedule-calendar-toolbar mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => changeView("dayGridMonth")}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${activeView === "dayGridMonth" ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Bulan
            </button>
            <button
              type="button"
              onClick={() => changeView("timeGridDay")}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${activeView === "timeGridDay" ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Hari
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button onClick={() => nav("prev")} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Bulan sebelumnya">
              <ChevronLeft size={16} strokeWidth={2.5}/>
            </button>
            <h2 className="min-w-0 flex-1 text-center text-base font-bold text-slate-800 sm:min-w-[170px] sm:flex-none sm:text-lg">{viewTitle}</h2>
            <button onClick={() => nav("next")} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Bulan berikutnya">
              <ChevronRight size={16} strokeWidth={2.5}/>
            </button>
          </div>
        </div>
        <div className="schedule-calendar-scroll">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={initialCalendarDate}
            headerToolbar={false}
            locale="id"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            firstDay={1}
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            height="auto"
            fixedWeekCount
            dayMaxEvents={2}
            moreLinkText={(count) => `+${count}`}
            events={events}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            eventClick={(event: EventClickArg) => setEditing(event.event.extendedProps.schedule as Schedule)}
            select={(info: DateSelectArg) => setEditing({ id: "", class_id: selectedClassId, package_id: "", mentor_id: "", starts_at: info.startStr, ends_at: info.endStr, room: null, notes: null, class_name: "", mentor_name: "" })}
            selectable
          />
        </div>
      </section>

      <div className="mt-5">
        <DataTableShell
          icon={CalendarDays}
          title="Database Jadwal"
          totalCount={visibleSchedules.length}
          totalLabel="jadwal terdaftar"
        >
        <div className="divide-y divide-slate-100 sm:hidden">
          {visibleSchedules.map((schedule) => (
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
          {visibleSchedules.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada jadwal"
              description="Tambah jadwal manual atau gunakan pola mingguan untuk mengatur sesi belajar."
              action={{ label: "+ Tambah Jadwal", onClick: () => setEditing(null) }}
            />
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[13px] text-slate-500">
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
          {visibleSchedules.map((schedule) => (
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
              {visibleSchedules.length === 0 && (
                <EmptyStateRow
                  colSpan={7}
                  icon={CalendarDays}
                  title="Belum ada jadwal"
                  description="Tambah jadwal manual atau gunakan pola mingguan."
                  action={{ label: "+ Tambah Jadwal", onClick: () => setEditing(null) }}
                />
              )}
            </tbody>
          </table>
        </div>
        </DataTableShell>
      </div>

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
                <AppSelect
                  name="class_id"
                  required
                  value={manualClassId}
                  onChange={(value) => { setManualClassId(value); setManualPackageId(""); setManualMentorId(""); }}
                  options={classes.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Pilih kelas"
                  className="w-full"
                />
              </Label>
              <Label text="Mentor">
                <AppSelect
                  name="mentor_id"
                  required
                  value={manualMentorId}
                  onChange={setManualMentorId}
                  disabled={!manualMentorOptions.length}
                  options={manualMentorOptions.map((mentor) => ({ value: mentor.id, label: mentor.name }))}
                  placeholder={manualClass ? "Pilih mentor" : "Pilih kelas dulu"}
                  className="w-full"
                />
              </Label>
              <Label text="Paket">
                <AppSelect
                  name="package_id"
                  value={manualPackageId}
                  onChange={setManualPackageId}
                  options={manualPackages.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Semua paket kelas"
                  className="w-full"
                />
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
              <button disabled={isPending || !manualMentorId} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
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
                <AppSelect
                  name="class_id"
                  required
                  value={patternClassId}
                  onChange={(value) => { setPatternClassId(value); setPatternPackageId(""); setPatternMentorId(""); }}
                  options={classes.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Pilih kelas"
                  className="w-full"
                />
              </Label>
              <Label text="Mentor">
                <AppSelect
                  name="mentor_id"
                  required
                  value={patternMentorId}
                  onChange={setPatternMentorId}
                  disabled={!patternMentorOptions.length}
                  options={patternMentorOptions.map((mentor) => ({ value: mentor.id, label: mentor.name }))}
                  placeholder={patternClass ? "Pilih mentor" : "Pilih kelas dulu"}
                  className="w-full"
                />
              </Label>
              <Label text="Paket">
                <AppSelect
                  name="package_id"
                  value={patternPackageId}
                  onChange={setPatternPackageId}
                  options={patternPackages.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Semua paket kelas"
                  className="w-full"
                />
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
                          className="h-4 w-4 accent-[#2563EB]"
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
              <button disabled={isPending || !patternMentorId || patternSlots.length === 0 || patternSlots.length > 120} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">
                {isPending ? "Membuat..." : "Generate Jadwal"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
      <ConfirmDialog
        open={deleteOpen}
        title="Hapus Jadwal?"
        description="Jadwal kelas ini akan dihapus dari kalender dan database jadwal."
        isPending={isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmRemove}
      />
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

function getClassMentorOptions(classOption: ClassOption | undefined, mentorNameById: Map<string, string>) {
  return (classOption?.mentor_ids ?? []).map((id) => ({
    id,
    name: mentorNameById.get(id) ?? "Mentor kelas",
  }));
}

function cleanLabel(value?: string | null) {
  const text = value?.trim();
  return text && text !== "-" ? text : "";
}

function scheduleTitle(schedule: Schedule) {
  return cleanLabel(schedule.subject_name) || cleanLabel(schedule.class_name) || cleanLabel(schedule.package_name) || "Jadwal Kelas";
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
