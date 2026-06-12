'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import {
  Loader2, Calendar, MapPin, Users, DollarSign, CheckCircle, Trash2, Search,
} from 'lucide-react';

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

const statusBadge: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'badge badge-pending',
  PENDING_ADMIN_APPROVAL:   'badge badge-review',
  ACCEPTED:                 'badge badge-accepted',
  REJECTED:                 'badge badge-rejected',
  COMPLETED:                'badge badge-completed',
};
const statusLabel: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'Faculty Review',
  PENDING_ADMIN_APPROVAL:   'Admin Review',
  ACCEPTED:                 'Accepted',
  REJECTED:                 'Rejected',
  COMPLETED:                'Completed',
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  Technical:           { bg: '#EFF6FF', text: '#2563EB' },
  Cultural:            { bg: '#FDF2F8', text: '#BE185D' },
  Sports:              { bg: '#FFF7ED', text: '#C2410C' },
  Workshop:            { bg: '#FFFBEB', text: '#B45309' },
  Seminar:             { bg: '#F5F3FF', text: '#6D28D9' },
  Hackathon:           { bg: '#ECFEFF', text: '#0E7490' },
  'Community Service': { bg: '#F0FDF4', text: '#15803D' },
};

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.proposals || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load events'); setLoading(false); });
  }, [session, router]);

  async function handleRegister(id: string) {
    setRegisteringId(id);
    const res = await fetch(`/api/events/${id}/register`, { method: 'POST' });
    setRegisteringId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Registration failed'); return; }
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, registrationCount: (e.registrationCount ?? 0) + 1 } : e));
    toast.success('Registered successfully!');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.message || 'Delete failed'); return; }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success('Event deleted');
  }

  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Browse and register for campus events</p>
        </div>
        <div className="text-sm text-[#94A3B8] bg-white border border-[#E9ECF5] rounded-xl px-4 py-2 font-medium">
          {filtered.length} events
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="saas-input pl-11"
          style={{ height: '44px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--role-soft)' }}>
            <Calendar className="h-7 w-7" style={{ color: 'var(--role-accent)' }} />
          </div>
          <p className="font-semibold text-[#1E293B]">No events found</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            {search ? 'Try a different search term' : 'No events available yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => {
            const catColor = categoryColors[event.category] ?? { bg: '#F8F9FC', text: '#64748B' };
            const seatsLeft = event.participantLimit ? event.participantLimit - (event.registrationCount ?? 0) : null;
            const isFull = seatsLeft !== null && seatsLeft <= 0;
            const canRegister = event.status === 'ACCEPTED' && !isFull && session?.user?.role === 'STUDENT';
            const canDelete = session?.user?.role === 'ADMIN' || event.authorId === session?.user?.id;

            return (
              <div key={event.id} className="event-card">
                {/* Thumb */}
                <div className="event-card-thumb" style={{ background: `linear-gradient(135deg, ${catColor.bg} 0%, #F8F9FC 100%)` }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: catColor.bg, border: `1.5px solid ${catColor.text}20` }}>
                      <Calendar className="h-6 w-6" style={{ color: catColor.text }} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: catColor.bg, color: catColor.text }}>
                      {event.category}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-[#0F172A] text-[15px] leading-tight line-clamp-1 flex-1">{event.title}</h3>
                    <span className={statusBadge[event.status] ?? 'badge badge-pending'} style={{ flexShrink: 0 }}>
                      {statusLabel[event.status] ?? event.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-2 mb-4">{event.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    {[
                      { icon: Users,      text: `${event.expectedAudience} expected` },
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

                  {event.participantLimit && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
                        <span>Seats filled</span>
                        <span>{event.registrationCount ?? 0}/{event.participantLimit}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((event.registrationCount ?? 0) / event.participantLimit) * 100)}%`,
                            background: 'var(--role-accent)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[#F1F5F9] px-5 py-3 gap-2">
                  {isFull && <span className="text-xs font-semibold text-red-500">Seats Full</span>}
                  {canRegister && (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="btn-primary"
                      style={{ height: '36px', fontSize: '13px', padding: '0 14px' }}
                    >
                      {registeringId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Register
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="ml-auto h-8 w-8 flex items-center justify-center rounded-xl border border-[#F1F5F9] text-[#94A3B8] hover:bg-red-50 hover:text-red-500 hover:border-red-100 disabled:opacity-50 transition-all"
                    >
                      {deletingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
