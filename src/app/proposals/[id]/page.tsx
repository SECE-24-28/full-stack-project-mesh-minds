'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Proposal, CommentRecord, FundingContributionRecord } from '@/types';
import {
  ThumbsUp, MessageSquare, DollarSign, ArrowLeft, MapPin, Users,
  Calendar, Loader2, Send, CheckCircle, Star, HandHeart, Trash2, XCircle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', cls: 'badge badge-pending' },
  PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',   cls: 'badge badge-review' },
  ACCEPTED:                 { label: 'Accepted',        cls: 'badge badge-accepted' },
  REJECTED:                 { label: 'Rejected',        cls: 'badge badge-rejected' },
  COMPLETED:                { label: 'Completed',       cls: 'badge badge-completed' },
};

const PENDING_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL'];

interface VolunteerApp {
  id: string; studentName: string; studentEmail: string;
  department?: string | null; rollNumber?: string | null;
  reason: string; status: string; createdAt: string;
}

const appStatusBadge: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PENDING:           { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', label: 'Pending' },
  PROPOSER_SELECTED: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Selected by You' },
  SELECTED:          { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Selected' },
  REJECTED:          { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', label: 'Rejected' },
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
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApp[]>([]);
  const [volunteerMeta, setVolunteerMeta] = useState<{ proposerQuota: number | null; selectedByProposer: number }>({ proposerQuota: null, selectedByProposer: 0 });
  const [processingVolId, setProcessingVolId] = useState<string | null>(null);

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
    if (action === 'approve') setVolunteerMeta((m) => ({ ...m, selectedByProposer: m.selectedByProposer + 1 }));
    toast.success(action === 'approve' ? 'Volunteer approved!' : 'Application denied');
  }

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

  const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
  const fundingProgress = proposal ? Math.min((totalFunding / proposal.budget) * 100, 100) : 0;

  if (!proposal) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  const status = statusConfig[proposal.status] ?? statusConfig.PENDING_FACULTY_APPROVAL;
  const isProposer = session?.user.id === proposal.authorId;
  const isAdmin = session?.user.role === 'ADMIN';
  const canDelete = (isProposer || isAdmin) && PENDING_STATUSES.includes(proposal.status);
  const showVolunteerPanel = (isProposer || isAdmin) && (proposal.requiredVolunteers ?? 0) > 0;

  return (
    <div className="page-content animate-fade-up">
      <button onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
        style={{ color: 'var(--role-accent)' }}>
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </button>

      {/* Hero card */}
      <div className="saas-card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={status.cls}>{status.label}</span>
              <span className="badge badge-completed">{proposal.category}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>{proposal.title}</h1>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>{proposal.description}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              by <span style={{ color: 'var(--text-body)' }}>{proposal.authorName}</span>
            </p>
          </div>
          <div className="flex items-start gap-2 flex-shrink-0">
            <button onClick={handleVote} disabled={voting || !session}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                voted
                  ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'border-[var(--card-border)] bg-white text-[var(--text-body)] hover:bg-[var(--role-soft)]'
              }`}>
              {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
              {proposal.voteCount} votes
            </button>
            {canDelete && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-4 py-2.5 text-sm font-semibold text-[#BE123C] hover:bg-[#FFE4E6] disabled:opacity-60 transition-all">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: MapPin,      label: 'Venue',    value: proposal.venue },
            { icon: Users,      label: 'Audience', value: `${proposal.expectedAudience} people` },
            { icon: DollarSign, label: 'Budget',   value: `₹${proposal.budget.toLocaleString()}` },
            { icon: Calendar,   label: 'Date',     value: new Date(proposal.startDate).toLocaleDateString() },
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

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left — Volunteer Panel + Comments */}
        <div className="space-y-6">

          {/* Volunteer Applications */}
          {showVolunteerPanel && (
            <div className="saas-card p-6" style={{ borderColor: '#DDD6FE' }}>
              <div className="mb-4 flex items-center gap-2">
                <HandHeart className="h-4 w-4" style={{ color: '#6D28D9' }} />
                <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Volunteer Applications</h2>
                <span className="ml-auto rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--role-soft)', color: 'var(--text-muted)' }}>
                  {volunteerApps.length} total
                </span>
              </div>

              {volunteerMeta.proposerQuota !== null && (
                <div className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#6D28D9' }}>
                  You can select up to <strong>{volunteerMeta.proposerQuota}</strong> volunteers ({volunteerMeta.selectedByProposer} selected).
                  The remaining {(proposal.requiredVolunteers ?? 0) - volunteerMeta.proposerQuota} slots are for the faculty mentor.
                </div>
              )}

              {volunteerApps.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No volunteer applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {volunteerApps.map((app) => {
                    const badge = appStatusBadge[app.status] ?? appStatusBadge.PENDING;
                    return (
                      <div key={app.id} className="rounded-xl p-4" style={{ border: '1px solid var(--card-border)', background: '#FAFBFF' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{app.studentName}</p>
                              {app.rollNumber && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.rollNumber}</span>}
                              {app.department && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {app.department}</span>}
                              <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{app.reason}</p>
                            <p className="mt-1 text-xs" style={{ color: '#94A3B8' }}>{new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          {app.status === 'PENDING' && (
                            <div className="flex flex-shrink-0 gap-2">
                              <button onClick={() => handleVolunteerAction(app.id, 'approve')}
                                disabled={processingVolId === app.id + 'approve' || (volunteerMeta.proposerQuota !== null && volunteerMeta.selectedByProposer >= volunteerMeta.proposerQuota)}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                                {processingVolId === app.id + 'approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                Approve
                              </button>
                              <button onClick={() => handleVolunteerAction(app.id, 'deny')}
                                disabled={processingVolId === app.id + 'deny'}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
                                {processingVolId === app.id + 'deny' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                Deny
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <form onSubmit={handleComment} className="mb-5">
                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--role-accent)' }}>
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-1 items-end gap-2 rounded-xl px-4 py-2.5"
                    style={{ border: '1px solid var(--card-border)', background: '#FFFFFF' }}>
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..." rows={2} required
                      className="flex-1 resize-none bg-transparent text-sm outline-none"
                      style={{ color: 'var(--text-heading)' }} />
                    <button type="submit" disabled={commenting || !commentText.trim()}
                      className="flex-shrink-0 transition-opacity disabled:opacity-40"
                      style={{ color: 'var(--role-accent)' }}>
                      {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Start the discussion!</p>
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
        </div>

        {/* Right — Faculty Rating + Funding */}
        <div className="space-y-6">

          {/* Faculty mentor rating */}
          {session?.user.role === 'FACULTY' && proposal.status === 'COMPLETED' && proposal.mentorFacultyId === session.user.id && (
            <div className="saas-card p-6" style={{ borderColor: '#FDE68A' }}>
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Rate This Event</h2>
              </div>
              {ratingDone || proposal.mentorRating ? (
                <p className="text-sm text-emerald-600">You have already rated this event ✓</p>
              ) : (
                <>
                  <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>Select a rating from 1–10 for this event you mentored.</p>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                      <button key={v} onClick={() => setMentorRating(v)}
                        className={`transition-colors ${mentorRating >= v ? 'text-amber-400' : 'text-[#CBD5E1] hover:text-amber-300'}`}>
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    ))}
                  </div>
                  {mentorRating > 0 && <p className="mb-3 text-xs font-semibold text-amber-600">{mentorRating}/10 selected</p>}
                  <button onClick={handleMentorRating} disabled={!mentorRating || submittingRating}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-all"
                    style={{ background: '#F59E0B' }}>
                    {submittingRating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Submit Rating
                  </button>
                </>
              )}
            </div>
          )}

          {/* Funding */}
          <div className="saas-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: '#4DC96A' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Funding</h2>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>₹{totalFunding.toLocaleString()}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>of ₹{proposal.budget.toLocaleString()}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--role-soft)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fundingProgress}%`, background: 'linear-gradient(90deg, #4DC96A, #059669)' }} />
              </div>
              <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                ₹{totalFunding.toLocaleString()} / ₹{proposal.budget.toLocaleString()} &nbsp;·&nbsp; {fundingProgress.toFixed(0)}% funded
              </p>
            </div>

            {session && (
              <form onSubmit={handleFunding} className="mb-5 flex gap-2">
                <input type="number" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="Amount (₹)" required min={1}
                  className="saas-input flex-1" style={{ height: '40px', fontSize: '13px' }} />
                <button type="submit" disabled={contributing}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-all flex-shrink-0"
                  style={{ background: '#4DC96A' }}>
                  {contributing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Fund
                </button>
              </form>
            )}

            <div className="space-y-2">
              {funding.length === 0 ? (
                <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No contributions yet.</p>
              ) : (
                funding.map((f) => (
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
    </div>
  );
}
