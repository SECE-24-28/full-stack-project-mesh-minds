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
  PARTICIPANT: '#6BB6FF',
  PROPOSER:    '#9FA1FF',
  VOLUNTEER:   '#7EDC92',
  MENTOR:      '#F59E0B',
};

const ADMIN_LEGEND = [
  { color: '#94A3B8', label: 'Accepted (no reminder)' },
  { color: '#7879F1', label: 'Accepted (reminder on)' },
  { color: '#7EDC92', label: 'Completed' },
];

export default function CalendarPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user.role === 'ADMIN';

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }

    const url = isAdmin ? '/api/admin/calendar' : '/api/calendar';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        let formatted: any[];
        if (isAdmin) {
          formatted = (data.events || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            backgroundColor: e.status === 'COMPLETED'
              ? '#7EDC92'
              : e.reminded ? '#7879F1' : '#94A3B8',
            borderColor: 'transparent',
            textColor: '#FFFFFF',
          }));
        } else {
          formatted = (data.events || []).map((e: CalendarEvent) => ({
            id: e.eventId,
            title: `${e.roleType}: ${e.title}`,
            start: e.start,
            end: e.end,
            backgroundColor: roleColors[e.roleType] || '#6BB6FF',
            borderColor: 'transparent',
            textColor: '#FFFFFF',
          }));
        }
        setEvents(formatted);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load calendar'); setLoading(false); });
  }, [session, sessionLoading, router, isAdmin]);

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  const legend = isAdmin
    ? ADMIN_LEGEND
    : Object.entries(roleColors).map(([role, color]) => ({ color, label: role.charAt(0) + role.slice(1).toLowerCase() }));

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'Events Calendar' : 'My Calendar'}</h1>
        <p className="page-subtitle">{isAdmin ? 'All accepted and completed events' : 'View your upcoming events and registrations'}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {legend.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E9ECF5] bg-white">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[13px] font-medium text-[#475569]">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="saas-card p-6">
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
