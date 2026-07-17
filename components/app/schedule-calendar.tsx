"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteSchedule, saveSchedule } from "@/app/admin/kelas/actions";

type Schedule = { id: string; class_id: string; mentor_id: string; starts_at: string; ends_at: string; room: string | null; notes: string | null; class_name: string; mentor_name: string };
type Props = { schedules: Schedule[]; classes: { id: string; name: string }[]; mentors: { id: string; full_name: string }[] };

export function ScheduleCalendar({ schedules, classes, mentors }: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  
  const [editing, setEditing] = useState<Schedule | null | undefined>(); 
  const [message, setMessage] = useState<string>(); 
  const [isPending, startTransition] = useTransition();
  
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
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${activeView === "dayGridMonth" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-brand/10"}`}
          >
            Month
          </button>
          <button 
            onClick={() => changeView("timeGridWeek")} 
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${activeView === "timeGridWeek" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-brand/10"}`}
          >
            Week
          </button>
          <button 
            onClick={() => changeView("timeGridDay")} 
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${activeView === "timeGridDay" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-brand/10"}`}
          >
            Day
          </button>
        </div>
        
        {/* Title, Nav, and Add Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-ink min-w-[200px]">{viewTitle}</h2>
            <div className="flex items-center gap-1.5">
              <button onClick={() => nav("prev")} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brandHover transition shadow-sm">
                <ChevronLeft size={20} strokeWidth={2.5}/>
              </button>
              <button onClick={() => nav("next")} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brandHover transition shadow-sm">
                <ChevronRight size={20} strokeWidth={2.5}/>
              </button>
            </div>
          </div>
          <button onClick={() => setEditing(null)} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brandHover shadow-sm transition">
            <Plus size={18} strokeWidth={2.5}/> Add
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-apple-soft custom-calendar">
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

      {editing !== undefined && (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-900/40 sm:items-center sm:justify-center sm:p-6">
          <form onSubmit={event => { event.preventDefault(); submit(event.currentTarget); }} className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl">
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
        </div>
      )}
    </>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { 
  return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{text}</span>{children}</label>; 
}

function localDateTime(value: string) { 
  if (!value) return ""; 
  const date = new Date(value); 
  const offset = date.getTimezoneOffset(); 
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); 
}
