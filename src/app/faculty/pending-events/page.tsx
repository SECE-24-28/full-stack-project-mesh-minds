'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import {
  Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign,
  ChevronDown, ChevronUp, Star, Clock, ArrowLeft,
} from 'lucide-react';

interface FundEntry { id: string; amount: number; contributor: string; }

interface Event {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string; status: string;
  authorName: string; authorDepartment?: string;
  funding: FundEntry[];
}

interface VolunteerApp {
  id: string; studentName: string; skill: string; reason: string; status: string; department?: string;
}

interface MentoredEvent {
  id: string; title: string; requiredVolunteers: number | null;
  volunteerApplications: VolunteerApp[];
  mentorQuota: number; mentorSelected: number;
}

interface CompletedEvent {
  id: string; title: string; adminRating: number | null; endDate: string;
}

const appStatusBadge: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PENDING:           { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', label: 'Pending' },
  PROPOSER_SELECTED: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Selected by Proposer' },
  SELECTED:          { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Selected' },
  REJECTED:          { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', label: 'Rejected' },
};

export default function FacultyPendingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [mentoredEvents, setMentoredEvents] = useState<MentoredEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingVolId, setProcessingVolId] = useState<string | null>(null);
  const [expandedVolSection, setExpandedVolSection] = useState<string | null>(null);
  const [mentorRatings, setMentorRatings] = useState<Record<string, number>>({});
  const [processingRateId, setProcessingRateId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'FACULTY') { router.push('/dashboard'); return; }
    setLoading(true);
    Promise.all([
      fetch('/api/faculty/pending-events').then((r) => r.json()),
      fetch('/api/faculty/mentored-volunteers').then((r) => r.json()),
      fetch('/api/faculty/completed-events').then((r) => r.json()),
    ])
      .then(([pendingData, volunteerData, completedData]) => {
        setEvents(pendingData.events || []);
        setMentoredEvents(volunteerData.events || []);
        setCompletedEvents(completedData.events || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, router]);

  // Keep selectedEvent in sync when events list updates
  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find((e) => e.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  }, [events]);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id);
    const res = await fetch(`/api/faculty/events/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    if (!res.ok) { toast.error('Action failed'); return; }
    setEvents((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: action === 'approve' ? 'ACCEPTED' : 'REJECTED' } : e
    ).filter((e) => e.status !== 'REJECTED'));
    if (selectedEvent?.id === id && action === 'reject') setSelectedEvent(null);
    toast.success(action === 'approve'
      ? 'Event approved! It will stay here until you rate it after completion.'
      : 'Event rejected');
  }

  async function handleVolunteerAction(appId: string, eventId: string, action: 'select' | 'reject') {
    setProcessingVolId(appId + action);
    const res = await fetch(`/api/engagement/volunteers/${appId}/${action}`, { method: 'PATCH' });
    setProcessingVolId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Action failed'); return; }
    const newStatus = action === 'select' ? 'SELECTED' : 'REJECTED';
    setMentoredEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const updatedApps = ev.volunteerApplications.map((a) => a.id === appId ? { ...a, status: newStatus } : a);
        return { ...ev, volunteerApplications: updatedApps, mentorSelected: updatedApps.filter((a) => a.status === 'SELECTED').length };
      })
    );
    toast.success(action === 'select' ? 'Volunteer selected!' : 'Application rejected');
  }

  async function handleRateEvent(id: string, endDate: string) {
    const rating = mentorRatings[id];
    if (!rating) { toast.error('Select a rating first'); return; }
    if (new Date() < new Date(endDate)) { toast.error('Event has not ended yet'); return; }
    setProcessingRateId(id);
    const res = await fetch(`/api/faculty/events/${id}/rate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorRating: rating }),
    });
    setProcessingRateId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed'); return; }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setCompletedEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEvent?.id === id) setSelectedEvent(null);
    toast.success('Rating submitted! Points awarded.');
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
    setEvents((prev) => prev.map((ev) =>
      ev.id === selectedEvent.id
        ? { ...ev, funding: [{ id: contribution.id, amount: contribution.amount, contributor: contribution.contributor }, ...ev.funding] }
        : ev
    ));
    setFundAmount('');
    toast.success('Contribution recorded!');
  }

  if (sessionLoading || loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  const pendingEvents = events.filter((e) => e.status === 'PENDING_FACULTY_APPROVAL');
  const acceptedEvents = events.filter((e) => e.status === 'ACCEPTED');

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedEvent) {
    const ev = selectedEvent;
    const isPending = ev.status === 'PENDING_FACULTY_APPROVAL';
    const isAccepted = ev.status === 'ACCEPTED';
    const ended = new Date() > new Date(ev.endDate);
    const rating = mentorRatings[ev.id] ?? 0;
    const totalFunding = ev.funding.reduce((s, f) => s + f.amount, 0);
    const fundProgress = Math.min((totalFunding / ev.budget) * 100, 100);

    return (
      <div className="page-content animate-fade-up" data-role="FACULTY">
        <button onClick={() => setSelectedEvent(null)}
          className="mb-6 flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--role-accent)' }}>
          <ArrowLeft className="h-4 w-4" /> Back to Review Events
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left — event details + actions */}
          <div className="space-y-6">
            <div className="saas-card p-6" style={isAccepted ? { borderColor: ended ? '#FDE68A' : '#BBF7D0' } : {}}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'var(--role-soft)', color: 'var(--role-accent)', border: '1px solid var(--role-soft2)' }}>
                      {ev.category}
                    </span>
                    {isPending && <span className="badge badge-pending">Awaiting Your Review</span>}
                    {isAccepted && !ended && <span className="badge badge-accepted">Approved — Ongoing</span>}
                    {isAccepted && ended && (
                      <span className="badge" style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}>
                        Ended — Rate to Complete
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>{ev.title}</h1>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>{ev.description}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    by <span style={{ color: 'var(--text-body)' }}>{ev.authorName}</span>
                    {ev.authorDepartment ? ` · ${ev.authorDepartment}` : ''}
                  </p>
                </div>

                {/* Approve/Reject */}
                {isPending && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(ev.id, 'approve')} disabled={processingId === ev.id}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 transition-all"
                      style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                      {processingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                    <button onClick={() => handleAction(ev.id, 'reject')} disabled={processingId === ev.id}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 transition-all"
                      style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C' }}>
                      {processingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { icon: MapPin,      label: 'Venue',      value: ev.venue },
                  { icon: Users,       label: 'Expected',   value: `${ev.expectedAudience} people` },
                  { icon: DollarSign,  label: 'Budget',     value: `₹${Number(ev.budget).toLocaleString()}` },
                  { icon: Calendar,    label: 'Start',      value: new Date(ev.startDate).toLocaleString() },
                  { icon: Calendar,    label: 'End',        value: new Date(ev.endDate).toLocaleString() },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl px-4 py-3"
                    style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)' }}>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Rating row for accepted events */}
              {isAccepted && (
                <div className="pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Rate &amp; submit {!ended && <span className="text-amber-600">(available after event ends)</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button key={v} onClick={() => setMentorRatings((r) => ({ ...r, [ev.id]: v }))}
                          className={`transition-colors ${rating >= v ? 'text-amber-400' : 'text-[#CBD5E1] hover:text-amber-300'}`}>
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      ))}
                      {rating > 0 && <span className="ml-1.5 text-xs font-semibold text-amber-600">{rating}/10</span>}
                    </div>
                    <button onClick={() => handleRateEvent(ev.id, ev.endDate)}
                      disabled={!rating || processingRateId === ev.id || !ended}
                      title={!ended ? 'Available after event ends' : ''}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: ended ? '#F0FDF4' : '#F8F9FC', border: `1px solid ${ended ? '#BBF7D0' : '#E9ECF5'}`, color: ended ? '#15803D' : '#94A3B8' }}>
                      {processingRateId === ev.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : ended ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {ended ? 'Submit Rating' : 'Waiting for End'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Funding panel */}
          <div className="saas-card p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" style={{ color: '#4DC96A' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Funding</h2>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
                  ₹{totalFunding.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  of ₹{Number(ev.budget).toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--role-soft)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fundProgress}%`, background: 'linear-gradient(90deg, #4DC96A, #059669)' }} />
              </div>
              <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                ₹{totalFunding.toLocaleString()} / ₹{Number(ev.budget).toLocaleString()} &nbsp;·&nbsp; {fundProgress.toFixed(0)}% funded
              </p>
            </div>

            {/* Contribute form */}
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

            {/* Contributions list */}
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
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="page-content animate-fade-up space-y-10" data-role="FACULTY">

      {/* ── Pending + Accepted Review Events ── */}
      <section>
        <div className="page-header">
          <h1 className="page-title">Events to Review</h1>
          <p className="page-subtitle">Click any event to view full details and funding — approved events remain here until you rate them after completion</p>
        </div>

        {pendingEvents.length === 0 && acceptedEvents.length === 0 ? (
          <div className="saas-card flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-10 w-10 mb-3" style={{ color: 'var(--role-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>No events in review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...pendingEvents, ...acceptedEvents].map((event) => {
              const isPending = event.status === 'PENDING_FACULTY_APPROVAL';
              const isAccepted = event.status === 'ACCEPTED';
              const ended = new Date() > new Date(event.endDate);
              const rating = mentorRatings[event.id] ?? 0;

              return (
                <div key={event.id} className="saas-card p-6 cursor-pointer"
                  style={isAccepted ? { borderColor: ended ? '#FDE68A' : '#BBF7D0' } : {}}
                  onClick={() => setSelectedEvent(event)}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--role-soft)', color: 'var(--role-accent)', border: '1px solid var(--role-soft2)' }}>
                          {event.category}
                        </span>
                        {isPending && <span className="badge badge-pending">Awaiting Your Review</span>}
                        {isAccepted && !ended && <span className="badge badge-accepted">Approved — Ongoing</span>}
                        {isAccepted && ended && (
                          <span className="badge" style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}>
                            Ended — Rate to Complete
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>{event.title}</h3>
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>{event.description}</p>
                      <p className="mt-1 text-xs" style={{ color: '#94A3B8' }}>
                        by {event.authorName}{event.authorDepartment && ` · ${event.authorDepartment}`}
                      </p>
                    </div>

                    {/* Approve/Reject — stop propagation */}
                    {isPending && (
                      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleAction(event.id, 'approve')} disabled={processingId === event.id}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 transition-all"
                          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                          {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                        <button onClick={() => handleAction(event.id, 'reject')} disabled={processingId === event.id}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 transition-all"
                          style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C' }}>
                          {processingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Rating + submit for accepted — stop propagation */}
                    {isAccepted && (
                      <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                            <button key={v} onClick={() => setMentorRatings((r) => ({ ...r, [event.id]: v }))}
                              className={`transition-colors ${rating >= v ? 'text-amber-400' : 'text-[#CBD5E1] hover:text-amber-300'}`}>
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          ))}
                          {rating > 0 && <span className="ml-1.5 text-xs font-semibold text-amber-600">{rating}/10</span>}
                        </div>
                        <button onClick={() => handleRateEvent(event.id, event.endDate)}
                          disabled={!rating || processingRateId === event.id || !ended}
                          title={!ended ? 'Available after event ends' : ''}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: ended ? '#F0FDF4' : '#F8F9FC', border: `1px solid ${ended ? '#BBF7D0' : '#E9ECF5'}`, color: ended ? '#15803D' : '#94A3B8' }}>
                          {processingRateId === event.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : ended ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {ended ? 'Submit Rating' : 'Waiting for End'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
                    {[
                      { icon: Users,      text: `${event.expectedAudience} attendees` },
                      { icon: DollarSign, text: `₹${event.budget.toLocaleString()}` },
                      { icon: MapPin,     text: event.venue },
                      { icon: Calendar,   text: `${new Date(event.startDate).toLocaleDateString()} – ${new Date(event.endDate).toLocaleDateString()}` },
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
      </section>

      {/* ── Rate Completed Events ── */}
      {completedEvents.length > 0 && (
        <section>
          <div className="page-header">
            <h2 className="page-title">Rate Completed Events</h2>
            <p className="page-subtitle">Submit your mentor rating for events marked as completed by admin</p>
          </div>
          <div className="space-y-4">
            {completedEvents.map((ev) => {
              const ended = new Date() > new Date(ev.endDate);
              const rating = mentorRatings[ev.id] ?? 0;
              return (
                <div key={ev.id} className="saas-card p-5" style={{ borderColor: '#FDE68A' }}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>{ev.title}</p>
                      {ev.adminRating && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Admin rating: {ev.adminRating}/10</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                          <button key={v} onClick={() => setMentorRatings((r) => ({ ...r, [ev.id]: v }))}
                            className={`transition-colors ${rating >= v ? 'text-amber-400' : 'text-[#CBD5E1] hover:text-amber-300'}`}>
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                        {rating > 0 && <span className="ml-1.5 text-xs font-bold text-amber-600">{rating}/10</span>}
                      </div>
                      <button onClick={() => handleRateEvent(ev.id, ev.endDate)}
                        disabled={!rating || processingRateId === ev.id || !ended}
                        title={!ended ? 'Available after event ends' : ''}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ background: ended ? '#F0FDF4' : '#F8F9FC', border: `1px solid ${ended ? '#BBF7D0' : '#E9ECF5'}`, color: ended ? '#15803D' : '#94A3B8' }}>
                        {processingRateId === ev.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : ended ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {ended ? 'Submit Rating' : 'Waiting for End'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Volunteer Applications ── */}
      {mentoredEvents.length > 0 && (
        <section>
          <div className="page-header">
            <h2 className="page-title">Volunteer Applications</h2>
            <p className="page-subtitle">Review volunteer applications for events you mentor</p>
          </div>
          <div className="space-y-4">
            {mentoredEvents.map((ev) => {
              const pendingCount = ev.volunteerApplications.filter((a) => a.status === 'PENDING').length;
              const isExpanded = expandedVolSection === ev.id;
              return (
                <div key={ev.id} className="saas-card overflow-hidden" style={{ borderColor: '#DDD6FE' }}>
                  <button className="flex w-full items-center justify-between p-5 text-left hover:bg-[#F5F3FF] transition-all"
                    onClick={() => setExpandedVolSection(isExpanded ? null : ev.id)}>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>{ev.title}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {ev.volunteerApplications.length} applicants · {pendingCount} pending ·
                        Your quota: <span style={{ color: '#6D28D9', fontWeight: 600 }}>{ev.mentorSelected} / {ev.mentorQuota}</span>
                      </p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5" style={{ borderTop: '1px solid #EDE9FE' }}>
                      {ev.volunteerApplications.length === 0 ? (
                        <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No applications yet.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {ev.volunteerApplications.map((app) => {
                            const badge = appStatusBadge[app.status] ?? appStatusBadge.PENDING;
                            return (
                              <div key={app.id} className="flex items-start justify-between gap-3 rounded-xl p-4"
                                style={{ border: '1px solid var(--card-border)', background: '#FAFBFF' }}>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{app.studentName}</p>
                                    {app.department && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {app.department}</span>}
                                    <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                                      style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                      {badge.label}
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{app.reason}</p>
                                </div>
                                {app.status === 'PENDING' && (
                                  <div className="flex flex-shrink-0 gap-2">
                                    <button onClick={() => handleVolunteerAction(app.id, ev.id, 'select')}
                                      disabled={processingVolId === app.id + 'select' || ev.mentorSelected >= ev.mentorQuota}
                                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-all"
                                      style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                                      {processingVolId === app.id + 'select' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                      Select
                                    </button>
                                    <button onClick={() => handleVolunteerAction(app.id, ev.id, 'reject')}
                                      disabled={processingVolId === app.id + 'reject'}
                                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-all"
                                      style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
                                      {processingVolId === app.id + 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
