'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign, HandHeart, ChevronDown, ChevronUp } from 'lucide-react';

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

interface VolunteerApp {
  id: string;
  studentName: string;
  skill: string;
  reason: string;
  status: string;
  department?: string;
}

interface MentoredEvent {
  id: string;
  title: string;
  requiredVolunteers: number | null;
  volunteerApplications: VolunteerApp[];
  mentorQuota: number;
  mentorSelected: number;
}

const appStatusBadge: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  PROPOSER_SELECTED: 'bg-blue-500/20 text-blue-400',
  SELECTED: 'bg-emerald-500/20 text-emerald-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

export default function FacultyPendingEventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [mentoredEvents, setMentoredEvents] = useState<MentoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingVolId, setProcessingVolId] = useState<string | null>(null);
  const [expandedVolSection, setExpandedVolSection] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'FACULTY') { router.push('/dashboard'); return; }

    Promise.all([
      fetch('/api/faculty/pending-events').then((r) => r.json()),
      fetch('/api/faculty/mentored-volunteers').then((r) => r.json()),
    ])
      .then(([pendingData, volunteerData]) => {
        setEvents(pendingData.events || []);
        setMentoredEvents(volunteerData.events || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
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
    setEvents((events) => events.filter((e) => e.id !== id));
    toast.success(`Event ${action}d`);
  }

  async function handleVolunteerAction(appId: string, eventId: string, action: 'select' | 'reject') {
    setProcessingVolId(appId + action);
    const endpoint = `/api/engagement/volunteers/${appId}/${action}`;
    const res = await fetch(endpoint, { method: 'PATCH' });
    setProcessingVolId(null);

    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Action failed'); return; }

    const newStatus = action === 'select' ? 'SELECTED' : 'REJECTED';
    setMentoredEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const updatedApps = ev.volunteerApplications.map((a) => a.id === appId ? { ...a, status: newStatus } : a);
        const mentorSelected = updatedApps.filter((a) => a.status === 'SELECTED').length;
        return { ...ev, volunteerApplications: updatedApps, mentorSelected };
      })
    );
    toast.success(action === 'select' ? 'Volunteer selected!' : 'Application rejected');
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
    <div className="animate-fade-in p-8 space-y-10">

      {/* Pending Event Reviews */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Events to Review</h1>
          <p className="mt-1 text-sm text-slate-500">Review student event proposals assigned to you.</p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-16 text-center">
            <CheckCircle className="mb-4 h-10 w-10 text-emerald-400" />
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
                  <div className="flex items-center gap-1.5 text-slate-500"><Users className="h-3.5 w-3.5" />{event.expectedAudience} attendees</div>
                  <div className="flex items-center gap-1.5 text-slate-500"><DollarSign className="h-3.5 w-3.5" />${event.budget.toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 text-slate-500"><MapPin className="h-3.5 w-3.5" />{event.venue}</div>
                  <div className="flex items-center gap-1.5 text-slate-500"><Calendar className="h-3.5 w-3.5" />{new Date(event.startDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Volunteer Applications for Mentored Events */}
      {mentoredEvents.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Volunteer Applications</h2>
            <p className="mt-1 text-sm text-slate-500">Review volunteer applications for events you mentor.</p>
          </div>

          <div className="space-y-4">
            {mentoredEvents.map((ev) => {
              const pendingCount = ev.volunteerApplications.filter((a) => a.status === 'PENDING').length;
              const isExpanded = expandedVolSection === ev.id;

              return (
                <div key={ev.id} className="rounded-2xl border border-violet-500/20 bg-violet-500/5">
                  <button
                    className="flex w-full items-center justify-between p-5 text-left"
                    onClick={() => setExpandedVolSection(isExpanded ? null : ev.id)}
                  >
                    <div>
                      <p className="font-semibold text-white">{ev.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {ev.volunteerApplications.length} applicants · {pendingCount} pending ·
                        Your quota: <span className="text-violet-400">{ev.mentorSelected} / {ev.mentorQuota}</span>
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-violet-500/10 px-5 pb-5">
                      {ev.volunteerApplications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-600">No applications yet.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {ev.volunteerApplications.map((app) => (
                            <div key={app.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/3 p-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-200">{app.studentName}</p>
                                  {app.department && <span className="text-xs text-slate-500">· {app.department}</span>}
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${appStatusBadge[app.status] ?? appStatusBadge.PENDING}`}>
                                    {app.status === 'PROPOSER_SELECTED' ? 'Selected by Proposer' : app.status}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{app.reason}</p>
                              </div>
                              {app.status === 'PENDING' && (
                                <div className="flex flex-shrink-0 gap-2">
                                  <button
                                    onClick={() => handleVolunteerAction(app.id, ev.id, 'select')}
                                    disabled={
                                      processingVolId === app.id + 'select' ||
                                      ev.mentorSelected >= ev.mentorQuota
                                    }
                                    className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                                  >
                                    {processingVolId === app.id + 'select' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                    Select
                                  </button>
                                  <button
                                    onClick={() => handleVolunteerAction(app.id, ev.id, 'reject')}
                                    disabled={processingVolId === app.id + 'reject'}
                                    className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                                  >
                                    {processingVolId === app.id + 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
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
