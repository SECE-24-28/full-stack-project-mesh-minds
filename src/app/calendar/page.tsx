'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/types';

const roleColors: Record<string, string> = {
  PARTICIPANT: '#3B9EFF',
  PROPOSER:    '#6366F1',
  VOLUNTEER:   '#4DC96A',
  MENTOR:      '#F59E0B',
};

export default function CalendarPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((d) => {
        setEvents((d.events || []).map((e: CalendarEvent) => ({
          id: e.eventId,
          title: `${e.roleType}: ${e.title}`,
          start: e.start, end: e.end,
          backgroundColor: roleColors[e.roleType] ?? '#6366F1',
          borderColor: 'transparent',
          textColor: '#FFFFFF',
        })));
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load calendar'); setLoading(false); });
  }, [session, sessionLoading, router]);

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">My Calendar</h1>
        <p className="page-subtitle">View your upcoming events and registrations</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(roleColors).map(([role, color]) => (
          <div key={role} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white"
            style={{ border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-body)' }}>
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>

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
