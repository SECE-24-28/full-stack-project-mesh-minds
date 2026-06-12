'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/types';

const roleColors: Record<string, string> = {
  PARTICIPANT: '#3B82F6',
  PROPOSER: '#EC4899',
  VOLUNTEER: '#10B981',
  MENTOR: '#F97316',
};

export default function CalendarPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/calendar')
      .then((r) => r.json())
      .then((data) => {
        const formatted = (data.events || []).map((e: CalendarEvent) => ({
          id: e.eventId,
          title: `${e.roleType}: ${e.title}`,
          start: e.start,
          end: e.end,
          backgroundColor: roleColors[e.roleType] || '#3B82F6',
          borderColor: roleColors[e.roleType] || '#3B82F6',
        }));
        setEvents(formatted);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load calendar');
        setLoading(false);
      });
  }, [session, sessionLoading, router]);

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">View your upcoming events and registrations.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { label: 'Participant', color: roleColors.PARTICIPANT },
          { label: 'Proposer', color: roleColors.PROPOSER },
          { label: 'Volunteer', color: roleColors.VOLUNTEER },
          { label: 'Mentor', color: roleColors.MENTOR },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 rounded-full border border-white/5 bg-slate-900/60 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-6">
        <style>{`
          .fc { --fc-border-color: rgba(255,255,255,0.06); --fc-today-bg-color: rgba(59,130,246,0.07); --fc-event-border-color: transparent; }
          .fc-theme-standard td, .fc-theme-standard th, .fc-scrollgrid { border-color: rgba(255,255,255,0.06) !important; }
          .fc-col-header-cell-cushion, .fc-daygrid-day-number, .fc-toolbar-title { color: #94A3B8; font-size: 13px; }
          .fc-toolbar-title { font-size: 16px; font-weight: 600; color: #F8FAFC; }
          .fc-button { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #94A3B8 !important; border-radius: 8px !important; font-size: 12px !important; padding: 6px 12px !important; }
          .fc-button:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
          .fc-button-active { background: rgba(59,130,246,0.2) !important; color: #60A5FA !important; border-color: rgba(59,130,246,0.3) !important; }
          .fc-daygrid-day-number { color: #64748B; }
          .fc-day-today .fc-daygrid-day-number { color: #60A5FA; font-weight: 700; }
          .fc-event { border-radius: 6px !important; font-size: 11px !important; padding: 1px 4px !important; }
          .fc-event-title { font-weight: 500; }
          .fc-col-header-cell { background: rgba(255,255,255,0.02); }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          height="auto"
        />
      </div>
    </div>
  );
}
