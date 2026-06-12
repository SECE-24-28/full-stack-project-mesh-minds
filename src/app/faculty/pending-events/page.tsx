'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  expectedAudience: number;
  budget: number;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  authorName: string;
  authorDepartment?: string;
}

export default function FacultyPendingEventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'FACULTY') { router.push('/dashboard'); return; }
    fetch('/api/faculty/pending-events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load events'); setLoading(false); });
  }, [session, router]);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id);
    const res = await fetch(`/api/faculty/events/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    if (!res.ok) { toast.error('Action failed'); return; }
    setEvents((e) => e.filter((ev) => ev.id !== id));
    toast.success(`Event ${action}d`);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up" data-role="FACULTY">
      <div className="page-header">
        <h1 className="page-title">Events to Review</h1>
        <p className="page-subtitle">Review student event proposals assigned to you</p>
      </div>

      {events.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[#EAFBEE] flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-[#7EDC92]" />
          </div>
          <p className="font-semibold text-[#1E293B]">All caught up!</p>
          <p className="text-sm text-[#94A3B8] mt-1">No proposals pending your review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="saas-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8F9FC] border border-[#E9ECF5] text-[#64748B] mb-2 inline-block">
                    {event.category}
                  </span>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">{event.title}</h3>
                  <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{event.description}</p>
                  <p className="mt-1.5 text-xs text-[#94A3B8]">
                    by {event.authorName}{event.authorDepartment && ` · ${event.authorDepartment}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(event.id, 'approve')}
                    disabled={processingId === event.id}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-2 text-sm font-semibold text-[#15803D] hover:bg-[#DCFCE7] disabled:opacity-60 transition-all"
                  >
                    {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(event.id, 'reject')}
                    disabled={processingId === event.id}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] px-4 py-2 text-sm font-semibold text-[#BE123C] hover:bg-[#FFE4E6] disabled:opacity-60 transition-all"
                  >
                    {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Reject
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-[#F1F5F9]">
                {[
                  { icon: Users,      text: `${event.expectedAudience} attendees` },
                  { icon: DollarSign, text: `₹${Number(event.budget).toLocaleString()}` },
                  { icon: MapPin,     text: event.venue },
                  { icon: Calendar,   text: new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
