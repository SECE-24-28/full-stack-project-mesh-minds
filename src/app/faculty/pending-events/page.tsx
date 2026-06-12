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
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'FACULTY') {
      router.push('/dashboard');
      return;
    }

    fetch('/api/faculty/pending-events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load events');
        setLoading(false);
      });
  }, [session, router]);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id);

    const res = await fetch(`/api/faculty/events/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    setProcessingId(null);

    if (!res.ok) {
      toast.error('Action failed');
      return;
    }

    setEvents((events) => events.filter((e) => e.id !== id));
    toast.success(`Event ${action}d`);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Events to Review</h1>
        <p className="mt-1 text-sm text-slate-500">Review student event proposals assigned to you.</p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-20 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-emerald-400" />
          <p className="text-slate-300">No events pending your review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{event.description}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    by {event.authorName} {event.authorDepartment && `• ${event.authorDepartment}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(event.id, 'approve')}
                    disabled={processingId === event.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-60"
                  >
                    {processingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(event.id, 'reject')}
                    disabled={processingId === event.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-60"
                  >
                    {processingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Reject
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  {event.expectedAudience} attendees
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                  ${event.budget.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}