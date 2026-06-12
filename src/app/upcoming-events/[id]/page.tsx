'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign, ThumbsUp,
  Clock, CheckCircle, MessageSquare, Send, Loader2, UserCheck, Tag, HandHeart, X,
} from 'lucide-react';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  expectedAudience: number;
  budget: number;
  startDate: string;
  endDate: string;
  venue: string;
  coverImage?: string | null;
  status: string;
  authorId: string;
  authorName: string;
  authorDepartment?: string | null;
  mentorFacultyName?: string | null;
  participantLimit?: number | null;
  requiredVolunteers?: number | null;
  voteCount: number;
  registrationCount: number;
  hasVoted: boolean;
  isRegistered: boolean;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review',  cls: 'bg-amber-500/20 text-amber-400' },
  PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',    cls: 'bg-blue-500/20 text-blue-400' },
  ACCEPTED:                 { label: 'Accepted',         cls: 'bg-emerald-500/20 text-emerald-400' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Technical: 'bg-blue-500/10 text-blue-400',
  Cultural: 'bg-pink-500/10 text-pink-400',
  Sports: 'bg-orange-500/10 text-orange-400',
  Workshop: 'bg-amber-500/10 text-amber-400',
  Seminar: 'bg-violet-500/10 text-violet-400',
  Hackathon: 'bg-cyan-500/10 text-cyan-400',
  'Community Service': 'bg-emerald-500/10 text-emerald-400',
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

  // Volunteer modal state
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

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.message || 'Registration failed');
      return;
    }
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

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.message || 'Application failed');
      return;
    }
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
    setComments((c) => [{
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      createdAt: comment.createdAt,
    }, ...c]);
    setCommentText('');
    toast.success('Comment posted');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">Event not found.</p>
      </div>
    );
  }

  const sc = STATUS_CONFIG[event.status];
  const spotsLeft = event.participantLimit ? event.participantLimit - event.registrationCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isStudent = session?.user.role === 'STUDENT';
  const canVote = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED'].includes(event.status);
  const canVolunteer = isStudent && event.status === 'ACCEPTED' && (event.requiredVolunteers ?? 0) > 0;

  return (
    <div className="animate-fade-in p-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Upcoming Events
      </button>

      {/* Cover image */}
      {event.coverImage && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={event.coverImage} alt={event.title} className="h-64 w-full object-cover" />
        </div>
      )}

      {/* Hero card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50">
        <div className="bg-gradient-to-r from-blue-600/10 via-transparent to-transparent p-6">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[event.category] ?? 'bg-slate-500/20 text-slate-400'}`}>
                  {event.category}
                </span>
                {sc && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.cls}`}>{sc.label}</span>
                )}
                {event.isRegistered && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    <UserCheck className="h-3 w-3" /> Registered
                  </span>
                )}
                {hasAppliedVolunteer && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                    <HandHeart className="h-3 w-3" /> Volunteer Applied
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{event.description}</p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>by <span className="text-slate-400">{event.authorName}</span>{event.authorDepartment ? ` · ${event.authorDepartment}` : ''}</span>
                {event.mentorFacultyName && (
                  <span>mentor: <span className="text-slate-400">{event.mentorFacultyName}</span></span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              {/* Vote */}
              {canVote && (
                <button
                  onClick={handleVote}
                  disabled={voting || !session}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                    event.hasVoted
                      ? 'border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/10'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300'
                  }`}
                >
                  {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  {event.voteCount} {event.hasVoted ? 'Voted' : 'Vote'}
                </button>
              )}

              {/* Register — students only */}
              {isStudent && (
                <button
                  onClick={handleRegister}
                  disabled={registering || (isFull && !event.isRegistered)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                    event.isRegistered
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300'
                      : isFull
                      ? 'cursor-not-allowed bg-slate-700/50 text-slate-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
                  }`}
                >
                  {registering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  {event.isRegistered ? 'Cancel Registration' : isFull ? 'Event Full' : 'Register'}
                </button>
              )}

              {/* Apply as Volunteer — students only, ACCEPTED events with volunteer slots */}
              {canVolunteer && (
                <button
                  onClick={() => setShowVolunteerModal(true)}
                  disabled={hasAppliedVolunteer}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                    hasAppliedVolunteer
                      ? 'bg-violet-500/20 text-violet-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                  }`}
                >
                  <HandHeart className="h-4 w-4" />
                  {hasAppliedVolunteer ? 'Applied as Volunteer' : 'Apply as Volunteer'}
                </button>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { icon: MapPin,      label: 'Venue',          value: event.venue },
              { icon: Calendar,    label: 'Start',          value: new Date(event.startDate).toLocaleString() },
              { icon: Calendar,    label: 'End',            value: new Date(event.endDate).toLocaleString() },
              { icon: Users,       label: 'Expected',       value: `${event.expectedAudience} people` },
              { icon: DollarSign,  label: 'Budget',         value: `$${event.budget.toLocaleString()}` },
              { icon: UserCheck,   label: 'Registered',     value: `${event.registrationCount}${event.participantLimit ? ` / ${event.participantLimit}` : ''}` },
              ...(event.requiredVolunteers ? [{ icon: Users, label: 'Volunteers needed', value: String(event.requiredVolunteers) }] : []),
              { icon: ThumbsUp,    label: 'Votes',          value: String(event.voteCount) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spots warning */}
      {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Clock className="h-4 w-4 flex-shrink-0" />
          Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining!
        </div>
      )}
      {isFull && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <Users className="h-4 w-4 flex-shrink-0" />
          This event has reached its participant limit.
        </div>
      )}

      {/* Comments */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <h2 className="font-semibold text-white">Discussion</h2>
          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{comments.length}</span>
        </div>

        {session && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-1 items-end gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 focus-within:border-white/20">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={2}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={commenting || !commentText.trim()}
                  className="flex-shrink-0 text-blue-400 transition-opacity hover:text-blue-300 disabled:opacity-40"
                >
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">No comments yet. Start the discussion!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-bold text-slate-300">
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{c.authorName}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{c.authorRole}</span>
                    <span className="ml-auto text-xs text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-400">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Volunteer Apply Modal */}
      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white">Apply as Volunteer</h2>
              </div>
              <button onClick={() => setShowVolunteerModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-400">
              Your application will be reviewed by the event proposer and faculty mentor.
            </p>

            <form onSubmit={handleVolunteerApply} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Why do you wish to be a volunteer? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={volunteerReason}
                  onChange={(e) => setVolunteerReason(e.target.value)}
                  placeholder="Tell us why you want to volunteer and what you can contribute..."
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                />
                <p className="mt-1 text-xs text-slate-600">{volunteerReason.length}/500 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVolunteerModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingVolunteer || !volunteerReason.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                >
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
