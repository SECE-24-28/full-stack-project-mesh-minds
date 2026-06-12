'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Proposal, CommentRecord, FundingContributionRecord } from '@/types';
import {
  ThumbsUp, MessageSquare, DollarSign, ArrowLeft, MapPin, Users,
  Calendar, Tag, Loader2, Send, CheckCircle, Star, HandHeart, Trash2, XCircle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', className: 'bg-amber-500/20 text-amber-400' },
  PENDING_ADMIN_APPROVAL: { label: 'Admin Review', className: 'bg-blue-500/20 text-blue-400' },
  ACCEPTED: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-400' },
  REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-400/20 text-slate-300' },
};

const PENDING_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL'];

interface VolunteerApp {
  id: string;
  studentName: string;
  studentEmail: string;
  department?: string | null;
  rollNumber?: string | null;
  reason: string;
  status: string;
  createdAt: string;
}

const appStatusBadge: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  PROPOSER_SELECTED: 'bg-emerald-500/20 text-emerald-400',
  SELECTED: 'bg-emerald-500/20 text-emerald-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

export default function ProposalDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [funding, setFunding] = useState<FundingContributionRecord[]>([]);
  const [commentText, setCommentText] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [mentorRating, setMentorRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Volunteer management state
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApp[]>([]);
  const [volunteerMeta, setVolunteerMeta] = useState<{ proposerQuota: number | null; selectedByProposer: number }>({ proposerQuota: null, selectedByProposer: 0 });
  const [processingVolId, setProcessingVolId] = useState<string | null>(null);

  async function handleMentorRating() {
    if (!mentorRating) return;
    setSubmittingRating(true);
    const res = await fetch(`/api/faculty/events/${proposal?.id}/rate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorRating }),
    });
    setSubmittingRating(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed'); return; }
    const { eventRating } = await res.json();
    toast.success(`Rating submitted! Final event rating: ${eventRating}/10`);
    setRatingDone(true);
  }

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setProposal(d.proposal ?? null);
        setComments(d.comments ?? []);
        setFunding(d.funding ?? []);
      });
  }, [params.id]);

  // Load volunteer apps when proposal is loaded and user is the proposer
  useEffect(() => {
    if (!proposal || !session) return;
    if (proposal.authorId !== session.user.id && session.user.role !== 'ADMIN') return;

    fetch(`/api/events/${proposal.id}/volunteers`)
      .then((r) => r.json())
      .then((d) => {
        setVolunteerApps(d.applications ?? []);
        setVolunteerMeta({ proposerQuota: d.proposerQuota, selectedByProposer: d.selectedByProposer ?? 0 });
      });
  }, [proposal, session]);

  async function handleVote() {
    setVoting(true);
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal?.id }),
    });
    setVoting(false);
    if (!res.ok) { toast.error('Vote failed'); return; }
    const { voted: newVoted } = await res.json();
    setVoted(newVoted);
    setProposal((p) => p ? { ...p, voteCount: p.voteCount + (newVoted ? 1 : -1) } : p);
    toast.success(newVoted ? 'Vote added!' : 'Vote removed');
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    setCommenting(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal?.id, content: commentText }),
    });
    setCommenting(false);
    if (!res.ok) { toast.error('Comment failed'); return; }
    const { comment } = await res.json();
    setComments((c) => [comment, ...c]);
    setCommentText('');
    toast.success('Comment posted');
  }

  async function handleFunding(e: React.FormEvent) {
    e.preventDefault();
    setContributing(true);
    const res = await fetch('/api/funding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal?.id, amount: Number(fundingAmount) }),
    });
    setContributing(false);
    if (!res.ok) { toast.error('Contribution failed'); return; }
    const { contribution } = await res.json();
    setFunding((f) => [contribution, ...f]);
    setFundingAmount('');
    toast.success('Contribution recorded!');
  }

  async function handleDelete() {
    if (!proposal) return;
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    setDeleting(true);
    const res = await fetch(`/api/events/${proposal.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Delete failed'); return; }
    toast.success('Event deleted');
    router.push('/proposals');
  }

  async function handleVolunteerAction(applicationId: string, action: 'approve' | 'deny') {
    if (!proposal) return;
    setProcessingVolId(applicationId + action);
    const res = await fetch(`/api/events/${proposal.id}/volunteers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, action }),
    });
    setProcessingVolId(null);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Action failed'); return; }

    const newStatus = action === 'approve' ? 'PROPOSER_SELECTED' : 'REJECTED';
    setVolunteerApps((apps) => apps.map((a) => a.id === applicationId ? { ...a, status: newStatus } : a));
    if (action === 'approve') {
      setVolunteerMeta((m) => ({ ...m, selectedByProposer: m.selectedByProposer + 1 }));
    }
    toast.success(action === 'approve' ? 'Volunteer approved!' : 'Application denied');
  }

  const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
  const fundingProgress = proposal ? Math.min((totalFunding / proposal.budget) * 100, 100) : 0;

  if (!proposal) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-slate-500">Loading proposal...</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[proposal.status] ?? statusConfig.PENDING_FACULTY_APPROVAL;
  const isProposer = session?.user.id === proposal.authorId;
  const isAdmin = session?.user.role === 'ADMIN';
  const canDelete = (isProposer || isAdmin) && PENDING_STATUSES.includes(proposal.status);
  const showVolunteerPanel = (isProposer || isAdmin) && (proposal.requiredVolunteers ?? 0) > 0;

  return (
    <div className="animate-fade-in p-8">
      {/* Back */}
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300">
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </button>

      {/* Hero card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50">
        <div className="bg-gradient-to-r from-blue-600/10 via-transparent to-transparent p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{proposal.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{proposal.description}</p>
              <p className="mt-3 text-xs text-slate-600">Proposed by <span className="text-slate-400">{proposal.authorName}</span></p>
            </div>
            <div className="flex items-start gap-2">
              <button
                onClick={handleVote}
                disabled={voting || !session}
                className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                  voted
                    ? 'border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/10'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300'
                }`}
              >
                {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                {proposal.voteCount} votes
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: MapPin, label: 'Venue', value: proposal.venue },
              { icon: Users, label: 'Audience', value: `${proposal.expectedAudience} people` },
              { icon: DollarSign, label: 'Budget', value: `$${proposal.budget.toLocaleString()}` },
              { icon: Calendar, label: 'Date', value: new Date(proposal.startDate).toLocaleDateString() },
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

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left — Comments + Volunteer Panel */}
        <div className="space-y-6">

          {/* Volunteer Applications Panel — proposer only */}
          {showVolunteerPanel && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-violet-400" />
                <h2 className="font-semibold text-white">Volunteer Applications</h2>
                <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">
                  {volunteerApps.length} total
                </span>
              </div>

              {volunteerMeta.proposerQuota !== null && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5">
                  <p className="text-xs text-violet-300">
                    You can select up to <span className="font-bold">{volunteerMeta.proposerQuota}</span> volunteers
                    ({volunteerMeta.selectedByProposer} selected).
                    The remaining {(proposal.requiredVolunteers ?? 0) - volunteerMeta.proposerQuota} slots are reserved for the faculty mentor.
                  </p>
                </div>
              )}

              {volunteerApps.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">No volunteer applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {volunteerApps.map((app) => (
                    <div key={app.id} className="rounded-xl border border-white/5 bg-white/3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-200">{app.studentName}</p>
                            {app.rollNumber && <span className="text-xs text-slate-500">{app.rollNumber}</span>}
                            {app.department && <span className="text-xs text-slate-500">· {app.department}</span>}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${appStatusBadge[app.status] ?? appStatusBadge.PENDING}`}>
                              {app.status === 'PROPOSER_SELECTED' ? 'Selected by You' : app.status}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{app.reason}</p>
                          <p className="mt-1 text-xs text-slate-600">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                        {app.status === 'PENDING' && (
                          <div className="flex flex-shrink-0 gap-2">
                            <button
                              onClick={() => handleVolunteerAction(app.id, 'approve')}
                              disabled={
                                processingVolId === app.id + 'approve' ||
                                (volunteerMeta.proposerQuota !== null && volunteerMeta.selectedByProposer >= volunteerMeta.proposerQuota)
                              }
                              className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              {processingVolId === app.id + 'approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleVolunteerAction(app.id, 'deny')}
                              disabled={processingVolId === app.id + 'deny'}
                              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {processingVolId === app.id + 'deny' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <form onSubmit={handleComment} className="mb-5">
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
                      required
                      className="flex-1 resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    />
                    <button type="submit" disabled={commenting || !commentText.trim()} className="flex-shrink-0 text-blue-400 transition-opacity hover:text-blue-300 disabled:opacity-40">
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
                      <div className="flex items-center gap-2">
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
        </div>

        {/* Right — Funding + Faculty Rating */}
        <div className="space-y-6">

          {/* Faculty mentor rating panel */}
          {session?.user.role === 'FACULTY' && proposal.status === 'COMPLETED' && proposal.mentorFacultyId === session.user.id && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <h2 className="font-semibold text-white">Rate This Event</h2>
              </div>
              {ratingDone || proposal.mentorRating ? (
                <p className="text-sm text-emerald-400">You have already rated this event ✓</p>
              ) : (
                <>
                  <p className="mb-3 text-xs text-slate-400">Select a rating from 1–10 for this event you mentored.</p>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                      <button key={v} onClick={() => setMentorRating(v)}
                        className={`rounded p-1 text-sm transition-colors ${ mentorRating >= v ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'}`}>
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    ))}
                  </div>
                  {mentorRating > 0 && <p className="mb-3 text-xs text-amber-400">{mentorRating}/10 selected</p>}
                  <button onClick={handleMentorRating} disabled={!mentorRating || submittingRating}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {submittingRating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Submit Rating
                  </button>
                </>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <h2 className="font-semibold text-white">Funding</h2>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-2xl font-bold text-white">${totalFunding.toLocaleString()}</span>
                <span className="text-sm text-slate-500">of ${proposal.budget.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{ width: `${fundingProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{fundingProgress.toFixed(0)}% funded</p>
            </div>

            {session && (
              <form onSubmit={handleFunding} className="mb-5 flex gap-2">
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="Amount ($)"
                  required
                  min={1}
                  className="flex-1 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20"
                />
                <button type="submit" disabled={contributing} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {contributing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Fund
                </button>
              </form>
            )}

            <div className="space-y-2">
              {funding.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-600">No contributions yet.</p>
              ) : (
                funding.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
                        {f.contributor.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300">{f.contributor}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">${f.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
