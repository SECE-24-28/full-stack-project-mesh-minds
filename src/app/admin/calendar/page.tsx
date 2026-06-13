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

const legend = [
  { label: 'Upcoming (Reminded)',    color: '#3B9EFF' },
  { label: 'Upcoming (No Reminder)', color: '#4DC96A' },
  { label: 'Completed',              color: '#9FA1FF' },
];

export default function AdminCalendarPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetch('/api/admin/calendar')
      .then((r) => r.json())
      .then((d) => {
        setEvents((d.events || []).map((e: any) => {
          let color = '#9FA1FF'; // COMPLETED
          if (e.status === 'ACCEPTED') {
            color = e.reminded ? '#3B9EFF' : '#4DC96A';
          }
          return {
            id: e.id, title: e.title, start: e.start, end: e.end,
            backgroundColor: color, borderColor: 'transparent', textColor: '#FFFFFF',
          };
        }));
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load calendar'); setLoading(false); });
  }, [session, sessionLoading, router]);

  if (loading || sessionLoading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Events Calendar</h1>
        <p className="page-subtitle">All upcoming and completed events across the platform</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {legend.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white"
            style={{ border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-body)' }}>{label}</span>
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
