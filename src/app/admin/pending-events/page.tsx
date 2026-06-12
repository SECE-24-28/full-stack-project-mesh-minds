'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign, Star, Bell, BellOff } from 'lucide-react';

interface PendingEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string; authorName: string; authorDepartment?: string; votes: number;
}
interface AcceptedEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string; authorName: string; authorDepartment?: string; reminded: boolean;
}

export default function AdminPendingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [accepted, setAccepted] = useState<AcceptedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');

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
      .catch(() => { toast.error('Failed to load'); setLoading(false); });
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
    const ev = pending.find((e) => e.id === id);
    setPending((e) => e.filter((ev) => ev.id !== id));
    if (action === 'approve' && ev) {
      setAccepted((a) => [...a, { ...ev, reminded: false }]);
    }
    toast.success(action === 'approve' ? 'Event approved!' : 'Event rejected');
  }

  async function handleRemind(id: string) {
    const res = await fetch('/api/admin/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    const { reminded } = await res.json();
    setAccepted((a) => a.map((ev) => ev.id === id ? { ...ev, reminded } : ev));
    toast.success(reminded ? 'Reminder set!' : 'Reminder cancelled');
  }

  async function handleComplete(id: string) {
    const rating = ratings[id];
    if (!rating) { toast.error('Select a rating first'); return; }
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
    toast.success('Marked as completed!');
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-up space-y-6" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Event Management</h1>
        <p className="page-subtitle">Review, approve, and manage all campus events</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[#E9ECF5] bg-white p-1 w-fit">
        {([
          { key: 'pending',  label: `Pending (${pending.length})` },
          { key: 'accepted', label: `Accepted (${accepted.length})` },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === t.key ? { background: 'var(--role-soft)', color: 'var(--role-accent)' } : { color: '#64748B' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PENDING */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="saas-card flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-10 w-10 mb-3" style={{ color: '#7EDC92' }} />
            <p className="font-semibold text-[#1E293B]">All caught up! No events pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((event) => (
              <div key={event.id} className="saas-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8F9FC] border border-[#E9ECF5] text-[#64748B]">{event.category}</span>
                      <span className="badge badge-review">{event.votes} votes</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#0F172A]">{event.title}</h3>
                    <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{event.description}</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">by {event.authorName}{event.authorDepartment && ` · ${event.authorDepartment}`}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      value={fundAmounts[event.id] ?? ''}
                      onChange={(e) => setFundAmounts((f) => ({ ...f, [event.id]: e.target.value }))}
                      placeholder="Fund ₹ (optional)"
                      min={0}
                      className="saas-input w-36 text-sm"
                      style={{ height: '36px' }}
                    />
                    <button onClick={() => handleAction(event.id, 'approve')} disabled={processingId === event.id}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-2 text-sm font-semibold text-[#15803D] hover:bg-[#DCFCE7] disabled:opacity-60 transition-all">
                      {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                    <button onClick={() => handleAction(event.id, 'reject')} disabled={processingId === event.id}
                      className="flex items-center gap-1.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] px-4 py-2 text-sm font-semibold text-[#BE123C] hover:bg-[#FFE4E6] disabled:opacity-60 transition-all">
                      {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Reject
                    </button>
                  </div>
                </div>
                <MetaRow event={event} />
              </div>
            ))}
          </div>
        )
      )}

      {/* ACCEPTED */}
      {tab === 'accepted' && (
        accepted.length === 0 ? (
          <div className="saas-card flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[#94A3B8]">No accepted events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accepted.map((event) => {
              const ended = new Date() >= new Date(event.endDate);
              return (
                <div key={event.id} className="saas-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8F9FC] border border-[#E9ECF5] text-[#64748B]">{event.category}</span>
                        <span className="badge badge-accepted">Accepted</span>
                        {event.reminded && <span className="badge" style={{ background: '#EEEEFF', color: '#7879F1', border: '1px solid #B5BAFF' }}>Reminder On</span>}
                      </div>
                      <h3 className="text-[16px] font-bold text-[#0F172A]">{event.title}</h3>
                      <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{event.description}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">by {event.authorName}{event.authorDepartment && ` · ${event.authorDepartment}`}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleRemind(event.id)}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all border"
                        style={event.reminded
                          ? { background: '#EEEEFF', color: '#7879F1', borderColor: '#B5BAFF' }
                          : { background: '#F8F9FC', color: '#64748B', borderColor: '#E9ECF5' }}>
                        {event.reminded ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                        {event.reminded ? 'Cancel Remind' : 'Remind Me'}
                      </button>
                      {ended ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                              <button key={v} onClick={() => setRatings((r) => ({ ...r, [event.id]: v }))}
                                className={`transition-colors ${(ratings[event.id] ?? 0) >= v ? 'text-amber-400' : 'text-[#E2E8F0] hover:text-amber-300'}`}>
                                <Star className="h-4 w-4 fill-current" />
                              </button>
                            ))}
                          </div>
                          <button onClick={() => handleComplete(event.id)} disabled={processingId === event.id || !ratings[event.id]}
                            className="flex items-center gap-1.5 rounded-xl bg-[#EEEEFF] border border-[#B5BAFF] px-4 py-2 text-sm font-semibold text-[#7879F1] hover:bg-[#E0E0FF] disabled:opacity-40 transition-all">
                            {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Mark Complete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#94A3B8] border border-[#E9ECF5] rounded-xl px-3 py-2">
                          Ends {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <MetaRow event={event} />
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function MetaRow({ event }: { event: { expectedAudience: number; budget: number; venue: string; startDate: string; endDate: string } }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9]">
      {[
        { icon: Users,      text: `${event.expectedAudience} attendees` },
        { icon: DollarSign, text: `₹${Number(event.budget).toLocaleString()}` },
        { icon: MapPin,     text: event.venue },
        { icon: Calendar,   text: `${new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
      ].map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{text}</span>
        </div>
      ))}
    </div>
  );
}
