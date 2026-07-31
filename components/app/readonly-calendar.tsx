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
  subject_name?: string;
  package_name?: string;
  student_names?: string[];
};

export function ReadonlyCalendar({ schedules }: { schedules: ReadonlySchedule[] }) {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");

  const getEventColorStyle = (class_name: string) => {
    const hash = class_name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: "#EEF6FF", border: "#2F80ED", text: "#1D4ED8" },
      { bg: "#F2F7FF", border: "#38BDF8", text: "#0369A1" },
      { bg: "#F4F2FF", border: "#8B5CF6", text: "#6D28D9" },
      { bg: "#ECFDF5", border: "#10B981", text: "#047857" },
      { bg: "#FFF7ED", border: "#FB923C", text: "#C2410C" },
    ];
    return colors[hash % colors.length];
  };

  const events = useMemo(() => schedules.map((x) => {
    const title = scheduleTitle(x);
    const colors = getEventColorStyle(title);
    return {
      id: x.id,
      title,
      start: x.starts_at,
      end: x.ends_at,
      extendedProps: { schedule: x, colors, title },
    };
  }), [schedules]);

  return (
    <section className={`shadcn-schedule-calendar ${activeView === "timeGridDay" ? "schedule-day-view" : "schedule-month-view"} rounded-2xl bg-white p-3 sm:p-4`}>
      <div className="schedule-calendar-toolbar mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${activeView === "dayGridMonth" ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Bulan
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.getApi().changeView("timeGridDay")}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${activeView === "timeGridDay" ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Hari
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Sebelumnya"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <h2 className="min-w-0 flex-1 text-center text-base font-bold text-slate-800 sm:min-w-[170px] sm:flex-none sm:text-lg">{viewTitle}</h2>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Berikutnya"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="schedule-calendar-scroll">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          dayMaxEvents={2}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          fixedWeekCount
          events={events}
          height="auto"
          datesSet={(arg) => {
            setViewTitle(arg.view.title);
            setActiveView(arg.view.type);
          }}
          eventContent={(arg) => {
            const { colors, schedule, title } = arg.event.extendedProps;
            const detail = [schedule?.mentor_name, schedule?.package_name].filter((value) => value && value !== "-").join(" - ");
            return (
              <div
                className="schedule-event-pill group relative flex w-full items-center gap-1.5 overflow-hidden rounded-sm px-2 text-left transition hover:brightness-[0.98]"
                style={{ backgroundColor: colors.bg }}
                title={`${title}${detail ? ` - ${detail}` : ""} ${arg.timeText}`}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.border }} />
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold leading-tight" style={{ color: colors.text }}>
                    {title}
                  </span>
                </span>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}

function cleanLabel(value?: string | null) {
  const text = value?.trim();
  return text && text !== "-" ? text : "";
}

function scheduleTitle(schedule: ReadonlySchedule) {
  return cleanLabel(schedule.subject_name) || cleanLabel(schedule.class_name) || cleanLabel(schedule.package_name) || "Jadwal Kelas";
}
