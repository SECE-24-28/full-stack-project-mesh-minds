'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Calendar, MapPin, Users, DollarSign, CheckCircle, Trash2 } from 'lucide-react';

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
  authorId: string;
  voteCount: number;
  registrationCount?: number;
  participantLimit?: number | null;
}

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.proposals || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load events');
        setLoading(false);
      });
  }, [session, router]);

  async function handleRegister(id: string) {
    setRegisteringId(id);

    const res = await fetch(`/api/events/${id}/register`, {
      method: 'POST',
    });

    setRegisteringId(null);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || 'Registration failed');
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, registrationCount: (e.registrationCount ?? 0) + 1 } : e
      )
    );
    toast.success('Registered successfully!');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || 'Could not delete event');
      return;
    }

    setEvents((prev) => prev.filter((event) => event.id !== id));
    toast.success('Event deleted');
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING_FACULTY_APPROVAL: { label: 'Pending Faculty', className: 'bg-amber-500/20 text-amber-400' },
    PENDING_ADMIN_APPROVAL: { label: 'Pending Admin', className: 'bg-blue-500/20 text-blue-400' },
    ACCEPTED: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-400' },
    REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400' },
    COMPLETED: { label: 'Completed', className: 'bg-slate-500/20 text-slate-400' },
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="mt-1 text-sm text-slate-500">Browse and register for campus events.</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-20 text-center">
          <Calendar className="mb-4 h-12 w-12 text-blue-400" />
          <p className="text-slate-300">No events available</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const status = statusConfig[event.status] ?? statusConfig.PENDING_FACULTY_APPROVAL;
            const seatsRemaining = event.participantLimit
              ? event.participantLimit - (event.registrationCount ?? 0)
              : null;
            const isFull = seatsRemaining !== null && seatsRemaining <= 0;
            const canRegister = event.status === 'ACCEPTED' && !isFull;
            const canDelete = session?.user?.role === 'ADMIN' || event.authorId === session?.user?.id;

            return (
              <div key={event.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50">
                <div className="flex-1 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">{event.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-100">{event.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{event.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {event.expectedAudience} attendees
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      ${event.budget.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
                  {event.participantLimit && (
                    <span className="text-xs text-slate-500">
                      {event.registrationCount ?? 0}/{event.participantLimit} seats filled
                    </span>
                  )}
                  {session?.user?.role === 'STUDENT' && canRegister && (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {registeringId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                      Register
                    </button>
                  )}
                  {isFull && (
                    <span className="text-xs font-medium text-red-400">Full</span>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-60"
                      title="Delete event"
                    >
                      {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
