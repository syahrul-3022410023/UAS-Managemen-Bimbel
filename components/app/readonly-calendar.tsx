"use client";

import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
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

  const getEventColorStyle = (class_name: string) => {
    const hash = class_name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: "#FFE4E6", border: "#E11D48", text: "#E11D48" },
      { bg: "#FEF3C7", border: "#D97706", text: "#D97706" },
      { bg: "#E0F2FE", border: "#0284C7", text: "#0369A1" },
      { bg: "#DBEAFE", border: "#2563EB", text: "#1D4ED8" },
      { bg: "#D1FAE5", border: "#059669", text: "#059669" },
    ];
    return colors[hash % colors.length];
  };

  const events = useMemo(() => schedules.map((x) => {
    const colors = getEventColorStyle(x.class_name);
    return {
      id: x.id,
      title: x.subject_name ?? x.class_name,
      start: x.starts_at,
      end: x.ends_at,
      extendedProps: { schedule: x, colors },
    };
  }), [schedules]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink"
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
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="min-w-[150px] text-lg font-bold text-ink">{viewTitle}</h2>
        </div>

        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-brand transition-all"
          >
            Bulan
          </button>
        </div>
      </div>

      <div className="calendar-container rounded-2xl border border-slate-100 bg-white p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
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
                className="flex w-full flex-col overflow-hidden rounded-md px-2 py-1 text-xs leading-tight"
                style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
              >
                <span className="truncate font-bold">{arg.timeText}</span>
                <span className="truncate font-medium">{arg.event.title}</span>
                <span className="truncate text-[10px] opacity-80">{schedule.student_names?.length ? schedule.student_names.join(", ") : schedule.class_name}</span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
