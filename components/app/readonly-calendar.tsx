"use client";

import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ReadonlySchedule = {
  id: string;
  class_name: string;
  starts_at: string;
  ends_at: string;
  room: string | null;
  mentor_name: string;
};

export function ReadonlyCalendar({ schedules }: { schedules: ReadonlySchedule[] }) {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");

  const getEventColorStyle = (class_name: string) => {
    const hash = class_name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
    const colors = getEventColorStyle(x.class_name);
    return {
      id: x.id, 
      title: `${x.class_name}`, 
      start: x.starts_at, 
      end: x.ends_at, 
      extendedProps: { schedule: x, colors }
    };
  }), [schedules]);

  return (
    <div className="flex flex-col gap-6">
      {/* Custom Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-apple-soft">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink hover:shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-ink"
            >
              Hari Ini
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink hover:shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="text-lg font-bold text-ink min-w-[150px]">{viewTitle}</h2>
        </div>
        
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => { setActiveView("dayGridMonth"); calendarRef.current?.getApi().changeView("dayGridMonth"); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeView === "dayGridMonth" ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-ink"
            }`}
          >
            Bulan
          </button>
          <button
            onClick={() => { setActiveView("timeGridWeek"); calendarRef.current?.getApi().changeView("timeGridWeek"); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeView === "timeGridWeek" ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-ink"
            }`}
          >
            Minggu
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-apple-soft calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          dayMaxEvents={3}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          events={events}
          height="auto"
          datesSet={(arg) => setViewTitle(arg.view.title)}
          eventContent={(arg) => {
            const { colors, schedule } = arg.event.extendedProps;
            return (
              <div 
                className="flex w-full flex-col overflow-hidden rounded-md px-2 py-1 text-xs leading-tight shadow-sm"
                style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
              >
                <span className="font-bold truncate">{arg.timeText}</span>
                <span className="font-medium truncate">{arg.event.title}</span>
                {activeView === "timeGridWeek" && (
                  <span className="truncate opacity-80 mt-1">{schedule.mentor_name} • {schedule.room || "Ruang -"}</span>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
