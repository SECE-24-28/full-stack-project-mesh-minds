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
      .then(([p, a]) => {
        setPending(p.events || []);
        setAccepted(a.events || []);
        setLoading(false);
      })
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
    if (event && new Date() < new Date(event.endDate)) {
      toast.error('Event has not ended yet');
      return;
    }

    setProcessingId(id);
    const res = await fetch(`/api/admin/events/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminRating: rating }),
    });
    setProcessingId(null);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || 'Failed');
      return;
    }
    setAccepted((e) => e.filter((ev) => ev.id !== id));
    toast.success('Event marked as completed');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8 space-y-10">
      {/* Pending approval */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pending Events</h1>
          <p className="mt-1 text-sm text-slate-500">Review events awaiting admin approval.</p>
        </div>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-12 text-center">
            <CheckCircle className="mb-3 h-10 w-10 text-emerald-400" />
            <p className="text-slate-300">No events pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((event) => (
              <EventCard key={event.id} event={event} processingId={processingId}>
                <button onClick={() => handleAction(event.id, 'approve')} disabled={processingId === event.id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-60">
                  {processingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Approve
                </button>
                <button onClick={() => handleAction(event.id, 'reject')} disabled={processingId === event.id}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-60">
                  {processingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
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
          <h2 className="text-xl font-bold text-white">Accepted Events</h2>
          <p className="mt-1 text-sm text-slate-500">Mark events as completed after they end. Rate the event (1–10) to award points.</p>
        </div>
        {accepted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-12 text-center">
            <p className="text-slate-500">No accepted events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accepted.map((event) => {
              const ended = new Date() >= new Date(event.endDate);
              return (
                <EventCard key={event.id} event={event} processingId={processingId}>
                  <div className="flex items-center gap-3">
                    {/* Star rating 1-10 */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button key={v} onClick={() => setRatings((r) => ({ ...r, [event.id]: v }))}
                          className={`text-sm transition-colors ${(ratings[event.id] ?? 0) >= v ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'}`}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </button>
                      ))}
                      {ratings[event.id] && <span className="ml-1 text-xs text-amber-400">{ratings[event.id]}/10</span>}
                    </div>
                    <button
                      onClick={() => handleComplete(event.id)}
                      disabled={processingId === event.id || !ended}
                      title={!ended ? 'Event has not ended yet' : ''}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 px-3 py-1.5 text-sm font-medium text-violet-400 hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {processingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
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

function EventCard({ event, processingId, children }: {
  event: Event;
  processingId: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-400 line-clamp-2">{event.description}</p>
          <p className="mt-2 text-xs text-slate-600">by {event.authorName}{event.authorDepartment && ` • ${event.authorDepartment}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="flex items-center gap-1.5 text-slate-500"><Users className="h-3.5 w-3.5" />{event.expectedAudience} attendees</div>
        <div className="flex items-center gap-1.5 text-slate-500"><DollarSign className="h-3.5 w-3.5" />${event.budget.toLocaleString()}</div>
        <div className="flex items-center gap-1.5 text-slate-500"><MapPin className="h-3.5 w-3.5" />{event.venue}</div>
        <div className="flex items-center gap-1.5 text-slate-500"><Calendar className="h-3.5 w-3.5" />{new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
