'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign, Star } from 'lucide-react';

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

export default function AdminPendingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [pending, setPending] = useState<Event[]>([]);
  const [accepted, setAccepted] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    Promise.all([
      fetch('/api/admin/pending-events').then((r) => r.json()),
      fetch('/api/admin/accepted-events').then((r) => r.json()),
    ])
      .then(([p, a]) => { setPending(p.events || []); setAccepted(a.events || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load events'); setLoading(false); });
  }, [session, sessionLoading, router]);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id);
    const res = await fetch(`/api/admin/events/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    if (!res.ok) { toast.error('Action failed'); return; }
    setPending((e) => e.filter((ev) => ev.id !== id));
    toast.success(`Event ${action}d`);
  }

  async function handleComplete(id: string) {
    const rating = ratings[id];
    if (!rating) { toast.error('Please select a rating first'); return; }
    const event = accepted.find((e) => e.id === id);
    if (event && new Date() < new Date(event.endDate)) { toast.error('Event has not ended yet'); return; }
    setProcessingId(id);
    const res = await fetch(`/api/admin/events/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminRating: rating }),
    });
    setProcessingId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed'); return; }
    setAccepted((e) => e.filter((ev) => ev.id !== id));
    toast.success('Marked as completed');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up space-y-10" data-role="ADMIN">
      {/* Pending */}
      <section>
        <div className="page-header">
          <h1 className="page-title">Pending Events</h1>
          <p className="page-subtitle">Review events awaiting admin approval</p>
        </div>
        {pending.length === 0 ? (
          <div className="saas-card flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#EAFBEE] flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-[#7EDC92]" />
            </div>
            <p className="font-semibold text-[#1E293B]">All caught up!</p>
            <p className="text-sm text-[#94A3B8] mt-1">No events pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((event) => (
              <EventCard key={event.id} event={event}>
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
              </EventCard>
            ))}
          </div>
        )}
      </section>

      {/* Accepted — mark complete */}
      <section>
        <div className="mb-6">
          <h2 className="page-title">Accepted Events</h2>
          <p className="page-subtitle">Mark events as completed after they end. Rate 1–10 to award points.</p>
        </div>
        {accepted.length === 0 ? (
          <div className="saas-card flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[#94A3B8]">No accepted events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accepted.map((event) => {
              const ended = new Date() >= new Date(event.endDate);
              return (
                <EventCard key={event.id} event={event}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button
                          key={v}
                          onClick={() => setRatings((r) => ({ ...r, [event.id]: v }))}
                          className={`transition-colors ${(ratings[event.id] ?? 0) >= v ? 'text-amber-400' : 'text-[#E2E8F0] hover:text-amber-300'}`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      ))}
                      {ratings[event.id] && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">{ratings[event.id]}/10</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleComplete(event.id)}
                      disabled={processingId === event.id || !ended}
                      title={!ended ? 'Event has not ended yet' : ''}
                      className="flex items-center gap-1.5 rounded-xl bg-[#EEEEFF] border border-[#B5BAFF] px-4 py-2 text-sm font-semibold text-[#7577FF] hover:bg-[#E0E0FF] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                    >
                      {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      {ended ? 'Mark Complete' : 'Not Ended Yet'}
                    </button>
                  </div>
                </EventCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EventCard({ event, children }: { event: Event; children: React.ReactNode }) {
  return (
    <div className="saas-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8F9FC] border border-[#E9ECF5] text-[#64748B]">
              {event.category}
            </span>
          </div>
          <h3 className="text-[16px] font-bold text-[#0F172A] leading-snug">{event.title}</h3>
          <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{event.description}</p>
          <p className="mt-1.5 text-xs text-[#94A3B8]">
            by {event.authorName}{event.authorDepartment && ` · ${event.authorDepartment}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-[#F1F5F9]">
        {[
          { icon: Users,      text: `${event.expectedAudience} attendees` },
          { icon: DollarSign, text: `₹${Number(event.budget).toLocaleString()}` },
          { icon: MapPin,     text: event.venue },
          { icon: Calendar,   text: `${new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
