'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  Loader2, CalendarDays, MapPin, Users, DollarSign, Star,
  CheckCircle, Bell, BellOff, X, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface FundEntry { id: string; amount: number; contributor: string; }

interface UpcomingEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string;
  authorName: string; authorDepartment: string | null;
  registrations: number; reminded: boolean;
  funding: FundEntry[];
}

const CAT_COLORS: Record<string, string> = {
  Technical: '#6366F1', Cultural: '#EC4899', Sports: '#F97316',
  Workshop: '#F59E0B', Seminar: '#8B5CF6', Hackathon: '#3B9EFF',
  'Community Service': '#4DC96A',
};

export default function AdminUpcomingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hovered, setHovered] = useState<{ id: string; star: number } | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetch('/api/admin/accepted-events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load'); setLoading(false); });
  }, [session, sessionLoading, router]);

  // keep selectedEvent in sync with events list
  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find((e) => e.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  }, [events]);

  async function handleRemind(id: string, currentlyReminded: boolean) {
    setRemindingId(id);
    const res = await fetch('/api/admin/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id }),
    });
    setRemindingId(null);
    if (!res.ok) { toast.error('Failed'); return; }
    const { reminded } = await res.json();
    setEvents((ev) => ev.map((e) => e.id === id ? { ...e, reminded } : e));
    toast.success(reminded ? 'Reminder set!' : 'Reminder removed');
  }

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !fundAmount) return;
    setContributing(true);
    const res = await fetch('/api/funding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: selectedEvent.id, amount: Number(fundAmount) }),
    });
    setContributing(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed'); return; }
    const { contribution } = await res.json();
    setEvents((ev) => ev.map((e) => e.id === selectedEvent.id
      ? { ...e, funding: [{ id: contribution.id, amount: contribution.amount, contributor: contribution.contributor }, ...e.funding] }
      : e
    ));
    setFundAmount('');
    toast.success('Contribution recorded!');
  }

  async function handleComplete(id: string) {
    const rating = ratings[id];
    if (!rating) { toast.error('Please select a star rating first'); return; }
    setProcessingId(id);
    const res = await fetch(`/api/admin/events/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminRating: rating }),
    });
    setProcessingId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed'); return; }
    setEvents((e) => e.filter((ev) => ev.id !== id));
    setSelectedEvent(null);
    toast.success('Event marked as completed!');
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  // ── Detail view ──────────────────────────────────────────
  if (selectedEvent) {
    const ev = selectedEvent;
    const ended = new Date() > new Date(ev.endDate);
    const selectedRating = ratings[ev.id] ?? 0;
    const totalFunding = ev.funding.reduce((s, f) => s + f.amount, 0);
    const fundProgress = Math.min((totalFunding / ev.budget) * 100, 100);
    const catColor = CAT_COLORS[ev.category] ?? '#6366F1';

    return (
      <div className="page-content animate-fade-up" data-role="ADMIN">
        <button onClick={() => setSelectedEvent(null)}
          className="mb-6 flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--role-accent)' }}>
          <ArrowLeft className="h-4 w-4" /> Back to Upcoming Events
        </button>

        {/* Hero */}
        <div className="saas-card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${catColor}15`, color: catColor }}>{ev.category}</span>
                <span className="badge badge-accepted">Approved</span>
                {ended && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Event Ended</span>}
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>{ev.title}</h1>
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>{ev.description}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                by <span style={{ color: 'var(--text-body)' }}>{ev.authorName}</span>
                {ev.authorDepartment ? ` · ${ev.authorDepartment}` : ''}
              </p>
            </div>

            {/* Remind Me button */}
            <button
              onClick={() => handleRemind(ev.id, ev.reminded)}
              disabled={remindingId === ev.id}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex-shrink-0"
              style={ev.reminded
                ? { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }
                : { background: 'var(--role-soft)', border: '1px solid var(--role-soft2)', color: 'var(--role-accent)' }}>
              {remindingId === ev.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : ev.reminded ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {ev.reminded ? 'Remove Reminder' : 'Remind Me'}
            </button>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { icon: MapPin,      label: 'Venue',      value: ev.venue },
              { icon: Users,       label: 'Expected',   value: `${ev.expectedAudience} people` },
              { icon: Users,       label: 'Registered', value: `${ev.registrations} registered` },
              { icon: DollarSign,  label: 'Budget',     value: `₹${Number(ev.budget).toLocaleString()}` },
              { icon: CalendarDays,label: 'Start',      value: new Date(ev.startDate).toLocaleString() },
              { icon: CalendarDays,label: 'End',        value: new Date(ev.endDate).toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl px-4 py-3" style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)' }}>
                <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Mark as completed */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              Rate &amp; mark as completed {!ended && <span className="text-amber-600">(available after event ends)</span>}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }, (_, i) => {
                  const star = i + 1;
                  const filled = hovered?.id === ev.id ? star <= hovered.star : star <= selectedRating;
                  return (
                    <Star key={star}
                      className={`h-5 w-5 cursor-pointer transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5E1]'}`}
                      onClick={() => setRatings((r) => ({ ...r, [ev.id]: star }))}
                      onMouseEnter={() => setHovered({ id: ev.id, star })}
                      onMouseLeave={() => setHovered(null)} />
                  );
                })}
                {selectedRating > 0 && <span className="ml-1.5 text-xs font-semibold text-amber-600">{selectedRating}/10</span>}
              </div>
              <button onClick={() => handleComplete(ev.id)}
                disabled={processingId === ev.id || !ended}
                title={!ended ? 'Event has not ended yet' : ''}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                {processingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Mark as Completed
              </button>
            </div>
          </div>
        </div>

        {/* Funding */}
        <div className="saas-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4" style={{ color: '#4DC96A' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Funding</h2>
          </div>

          <div className="mb-5">
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>₹{totalFunding.toLocaleString()}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>of ₹{Number(ev.budget).toLocaleString()}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--role-soft)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${fundProgress}%`, background: 'linear-gradient(90deg, #4DC96A, #059669)' }} />
            </div>
            <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              ₹{totalFunding.toLocaleString()} / ₹{Number(ev.budget).toLocaleString()} &nbsp;·&nbsp; {fundProgress.toFixed(0)}% funded
            </p>
          </div>

          <form onSubmit={handleFund} className="mb-5 flex gap-2">
            <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Amount (₹)" required min={1}
              className="saas-input flex-1" style={{ height: '40px', fontSize: '13px' }} />
            <button type="submit" disabled={contributing}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 flex-shrink-0 transition-all"
              style={{ background: '#4DC96A' }}>
              {contributing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Fund
            </button>
          </form>

          <div className="space-y-2">
            {ev.funding.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No contributions yet.</p>
            ) : (
              ev.funding.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ border: '1px solid var(--card-border)', background: '#FAFBFF' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: '#F0FDF4', color: '#15803D' }}>
                      {f.contributor.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-body)' }}>{f.contributor}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">₹{f.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="page-content animate-fade-up space-y-6" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Upcoming Events</h1>
        <p className="page-subtitle">Click an event to view details, add funding, or mark as completed</p>
      </div>

      {events.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-10 w-10 mb-3" style={{ color: 'var(--role-accent)' }} />
          <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>No upcoming events</p>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Approved events will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const ended = new Date() > new Date(ev.endDate);
            const selectedRating = ratings[ev.id] ?? 0;
            const catColor = CAT_COLORS[ev.category] ?? '#6366F1';

            return (
              <div key={ev.id} className="saas-card p-6 cursor-pointer"
                onClick={() => setSelectedEvent(ev)}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${catColor}15`, color: catColor }}>{ev.category}</span>
                      <span className="badge badge-accepted">Approved</span>
                      {ended && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Event Ended</span>}
                      {ev.reminded && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          <Bell className="h-3 w-3" /> Reminded
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>{ev.title}</h3>
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: '#64748B' }}>{ev.description}</p>
                    <p className="mt-1 text-xs" style={{ color: '#94A3B8' }}>
                      by {ev.authorName}{ev.authorDepartment && ` · ${ev.authorDepartment}`}
                    </p>
                  </div>

                  {/* Stars + complete — stop propagation so clicking these doesn't open detail */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => {
                        const star = i + 1;
                        const filled = hovered?.id === ev.id ? star <= hovered.star : star <= selectedRating;
                        return (
                          <Star key={star}
                            className={`h-5 w-5 cursor-pointer transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5E1]'}`}
                            onClick={() => setRatings((r) => ({ ...r, [ev.id]: star }))}
                            onMouseEnter={() => setHovered({ id: ev.id, star })}
                            onMouseLeave={() => setHovered(null)} />
                        );
                      })}
                      {selectedRating > 0 && <span className="ml-1.5 text-xs font-semibold text-amber-600">{selectedRating}/10</span>}
                    </div>
                    <button onClick={() => handleComplete(ev.id)}
                      disabled={processingId === ev.id || !ended}
                      title={!ended ? 'Event has not ended yet' : ''}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                      {processingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Mark as Completed
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
                  {[
                    { icon: Users,        text: `${ev.registrations} registered` },
                    { icon: DollarSign,   text: `₹${Number(ev.budget).toLocaleString()}` },
                    { icon: MapPin,       text: ev.venue },
                    { icon: CalendarDays, text: `${new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
