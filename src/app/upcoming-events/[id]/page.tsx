'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign, ThumbsUp,
  Clock, CheckCircle, MessageSquare, Send, Loader2, UserCheck, HandHeart, X,
} from 'lucide-react';

interface EventDetail {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number;
  startDate: string; endDate: string; venue: string;
  coverImage?: string | null; status: string;
  authorId: string; authorName: string; authorDepartment?: string | null;
  mentorFacultyName?: string | null;
  participantLimit?: number | null; requiredVolunteers?: number | null;
  voteCount: number; registrationCount: number;
  hasVoted: boolean; isRegistered: boolean;
}

interface Comment {
  id: string; content: string; authorName: string; authorRole: string; createdAt: string;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', cls: 'badge badge-pending' },
  PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',   cls: 'badge badge-review' },
  ACCEPTED:                 { label: 'Accepted',        cls: 'badge badge-accepted' },
};

const CAT_COLORS: Record<string, string> = {
  Technical: '#6366F1', Cultural: '#EC4899', Sports: '#F97316',
  Workshop: '#F59E0B', Seminar: '#8B5CF6', Hackathon: '#3B9EFF',
  'Community Service': '#4DC96A',
};

export default function UpcomingEventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerReason, setVolunteerReason] = useState('');
  const [applyingVolunteer, setApplyingVolunteer] = useState(false);
  const [hasAppliedVolunteer, setHasAppliedVolunteer] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/upcoming-events/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setEvent(d.event ?? null);
        setComments(d.comments ?? []);
        setHasAppliedVolunteer(d.hasAppliedVolunteer ?? false);
      })
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleVote() {
    if (!event) return;
    setVoting(true);
    const method = event.hasVoted ? 'DELETE' : 'POST';
    const res = await fetch(`/api/engagement/events/${event.id}/votes`, { method });
    setVoting(false);
    if (!res.ok) { toast.error('Vote failed'); return; }
    const data = await res.json();
    setEvent((ev) => ev ? { ...ev, voteCount: data.voteCount, hasVoted: data.voted } : ev);
    toast.success(data.voted ? 'Vote added!' : 'Vote removed');
  }

  async function handleRegister() {
    if (!event) return;
    setRegistering(true);
    const res = await fetch(`/api/upcoming-events/${event.id}/register`, { method: 'POST' });
    setRegistering(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Registration failed'); return; }
    const data = await res.json();
    setEvent((ev) => ev ? { ...ev, isRegistered: data.registered, registrationCount: data.registrationCount } : ev);
    toast.success(data.registered ? 'Registered successfully!' : 'Registration cancelled');
  }

  async function handleVolunteerApply(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !volunteerReason.trim()) return;
    setApplyingVolunteer(true);
    const res = await fetch(`/api/engagement/events/${event.id}/volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: volunteerReason }),
    });
    setApplyingVolunteer(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Application failed'); return; }
    setHasAppliedVolunteer(true);
    setShowVolunteerModal(false);
    setVolunteerReason('');
    toast.success('Volunteer application submitted!');
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !commentText.trim()) return;
    setCommenting(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: event.id, content: commentText }),
    });
    setCommenting(false);
    if (!res.ok) { toast.error('Comment failed'); return; }
    const { comment } = await res.json();
    setComments((c) => [{ id: comment.id, content: comment.content, authorName: comment.authorName, authorRole: comment.authorRole, createdAt: comment.createdAt }, ...c]);
    setCommentText('');
    toast.success('Comment posted');
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  if (!event) return (
    <div className="flex h-full items-center justify-center p-8">
      <p style={{ color: 'var(--text-muted)' }}>Event not found.</p>
    </div>
  );

  const sc = STATUS_CFG[event.status];
  const catColor = CAT_COLORS[event.category] ?? '#6366F1';
  const spotsLeft = event.participantLimit ? event.participantLimit - event.registrationCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isStudent = session?.user.role === 'STUDENT';
  const canVote = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED'].includes(event.status);
  const canVolunteer = isStudent && event.status === 'ACCEPTED' && (event.requiredVolunteers ?? 0) > 0;

  return (
    <div className="page-content animate-fade-up">
      <button onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--role-accent)' }}>
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </button>

      {event.coverImage && (
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ border: '1px solid var(--card-border)' }}>
          <img src={event.coverImage} alt={event.title} className="h-64 w-full object-cover" />
        </div>
      )}

      {/* Hero card */}
      <div className="saas-card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>
                {event.category}
              </span>
              {sc && <span className={sc.cls}>{sc.label}</span>}
              {event.isRegistered && (
                <span className="badge badge-accepted flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Registered
                </span>
              )}
              {hasAppliedVolunteer && (
                <span className="badge" style={{ background: '#F5F3FF', color: '#6D28D9', borderColor: '#DDD6FE' }}>
                  <HandHeart className="h-3 w-3 inline mr-1" />Volunteer Applied
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>{event.title}</h1>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{event.description}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              by <span style={{ color: 'var(--text-body)' }}>{event.authorName}</span>
              {event.authorDepartment ? ` · ${event.authorDepartment}` : ''}
              {event.mentorFacultyName ? ` · mentor: ${event.mentorFacultyName}` : ''}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start flex-shrink-0">
            {canVote && (
              <button onClick={handleVote} disabled={voting || !session}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                  event.hasVoted
                    ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-[var(--card-border)] bg-white text-[var(--text-body)] hover:bg-[var(--role-soft)] hover:border-[var(--role-secondary)]'
                }`}>
                {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                {event.voteCount} {event.hasVoted ? 'Voted' : 'Vote'}
              </button>
            )}

            {isStudent && (
              <button onClick={handleRegister} disabled={registering || (isFull && !event.isRegistered)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                  event.isRegistered
                    ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] hover:bg-[#FFF1F2] hover:text-[#BE123C] hover:border-[#FECDD3]'
                    : isFull
                    ? 'cursor-not-allowed bg-[#F8F9FC] border border-[#E9ECF5] text-[#94A3B8]'
                    : 'text-white'
                }`}
                style={!event.isRegistered && !isFull ? { background: 'var(--role-accent)' } : {}}>
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {event.isRegistered ? 'Cancel Registration' : isFull ? 'Event Full' : 'Register'}
              </button>
            )}

            {canVolunteer && (
              <button onClick={() => !hasAppliedVolunteer && setShowVolunteerModal(true)}
                disabled={hasAppliedVolunteer}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={hasAppliedVolunteer
                  ? { background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#6D28D9' }
                  : { background: '#6D28D9', color: '#FFFFFF' }}>
                <HandHeart className="h-4 w-4" />
                {hasAppliedVolunteer ? 'Applied as Volunteer' : 'Apply as Volunteer'}
              </button>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { icon: MapPin,      label: 'Venue',    value: event.venue },
            { icon: Calendar,   label: 'Start',    value: new Date(event.startDate).toLocaleString() },
            { icon: Calendar,   label: 'End',      value: new Date(event.endDate).toLocaleString() },
            { icon: Users,      label: 'Expected', value: `${event.expectedAudience} people` },
            { icon: DollarSign, label: 'Budget',   value: `₹${event.budget.toLocaleString()}` },
            { icon: UserCheck,  label: 'Registered', value: `${event.registrationCount}${event.participantLimit ? ` / ${event.participantLimit}` : ''}` },
            ...(event.requiredVolunteers ? [{ icon: Users, label: 'Volunteers needed', value: String(event.requiredVolunteers) }] : []),
            { icon: ThumbsUp,   label: 'Votes',    value: String(event.voteCount) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)' }}>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <item.icon className="h-3.5 w-3.5" />{item.label}
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spots warning */}
      {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Clock className="h-4 w-4 flex-shrink-0" />
          Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining!
        </div>
      )}
      {isFull && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <Users className="h-4 w-4 flex-shrink-0" />
          This event has reached its participant limit.
        </div>
      )}

      {/* Comments */}
      <div className="saas-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: 'var(--role-accent)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Discussion</h2>
          <span className="ml-auto rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--role-soft)', color: 'var(--text-muted)' }}>
            {comments.length}
          </span>
        </div>

        {session && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-3">
              <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'var(--role-accent)' }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-1 items-end gap-2 rounded-xl px-4 py-2.5"
                style={{ border: '1px solid var(--card-border)', background: '#FFFFFF' }}>
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..." rows={2}
                  className="flex-1 resize-none bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-heading)' }} />
                <button type="submit" disabled={commenting || !commentText.trim()}
                  className="flex-shrink-0 transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ color: 'var(--role-accent)' }}>
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Start the discussion!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--role-soft)', color: 'var(--role-accent)' }}>
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 rounded-xl px-4 py-3" style={{ border: '1px solid var(--card-border)', background: '#FAFBFF' }}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{c.authorName}</span>
                    <span className="badge badge-completed text-[10px]">{c.authorRole}</span>
                    <span className="ml-auto text-xs" style={{ color: '#94A3B8' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-body)' }}>{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Volunteer Modal */}
      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: '#FFFFFF', border: '1px solid var(--card-border)' }}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5" style={{ color: '#6D28D9' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Apply as Volunteer</h2>
              </div>
              <button onClick={() => setShowVolunteerModal(false)} style={{ color: 'var(--text-muted)' }}
                className="hover:opacity-70 transition-opacity">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Your application will be reviewed by the event proposer and faculty mentor.
            </p>

            <form onSubmit={handleVolunteerApply} className="space-y-4">
              <div>
                <label className="saas-label">Why do you wish to volunteer? <span className="text-red-500">*</span></label>
                <textarea value={volunteerReason} onChange={(e) => setVolunteerReason(e.target.value)}
                  placeholder="Tell us why you want to volunteer..." rows={4} required
                  className="saas-textarea" />
                <p className="mt-1 text-xs" style={{ color: '#94A3B8' }}>{volunteerReason.length}/500</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowVolunteerModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={applyingVolunteer || !volunteerReason.trim()}
                  className="btn-primary flex-1 justify-center" style={{ background: '#6D28D9', boxShadow: 'none' }}>
                  {applyingVolunteer ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
