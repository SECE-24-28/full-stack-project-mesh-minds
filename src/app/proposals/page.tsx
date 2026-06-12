'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Proposal } from '@/types';
import { Calendar, DollarSign, FileText, Loader2, MapPin, Plus, Trash2, Users } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', className: 'bg-amber-500/20 text-amber-400 border-amber-500/20' },
  PENDING_ADMIN_APPROVAL: { label: 'Admin Review', className: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
  ACCEPTED: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/20' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-400/20 text-slate-300 border-slate-400/20' },
};

const PENDING_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL'];

const categoryColors: Record<string, string> = {
  Technical: 'bg-blue-500/10 text-blue-400',
  Cultural: 'bg-pink-500/10 text-pink-400',
  Sports: 'bg-orange-500/10 text-orange-400',
  Workshop: 'bg-amber-500/10 text-amber-400',
  Seminar: 'bg-violet-500/10 text-violet-400',
  Hackathon: 'bg-cyan-500/10 text-cyan-400',
  'Community Service': 'bg-emerald-500/10 text-emerald-400',
};

export default function ProposalsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => toast.error('Failed to load proposals'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, router]);

  const visibleProposals = useMemo(() => {
    if (!session?.user) return [];
    if (session.user.role === 'ADMIN') return proposals;
    return proposals.filter((proposal) => proposal.authorId === session.user.id);
  }, [proposals, session]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || 'Could not delete event');
      return;
    }

    setProposals((items) => items.filter((item) => item.id !== id));
    toast.success('Event deleted');
  }

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {session?.user.role === 'ADMIN' ? 'Event Proposals' : 'My Proposals'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track proposal status from submission through approval.
          </p>
        </div>
        {session?.user.role !== 'ADMIN' && (
          <Link
            href="/events/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Link>
        )}
      </div>

      {visibleProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
            <FileText className="h-7 w-7 text-blue-400" />
          </div>
          <p className="font-semibold text-slate-200">No proposals yet</p>
          <p className="mt-1 text-sm text-slate-500">Submit a new proposal when your event idea is ready.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProposals.map((proposal) => {
            const status = statusConfig[proposal.status] ?? statusConfig.PENDING_FACULTY_APPROVAL;
            const canDelete = (session?.user.role === 'ADMIN' || proposal.authorId === session?.user.id)
                            && PENDING_STATUSES.includes(proposal.status);

            return (
              <div key={proposal.id} className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 transition-all duration-200 hover:border-white/10 hover:bg-slate-900/80">
                <div className="flex-1 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[proposal.category] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {proposal.category}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-100 line-clamp-1">{proposal.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{proposal.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {proposal.expectedAudience} audience
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      ${proposal.budget.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{proposal.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(proposal.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
                  <Link href={`/proposals/${proposal.id}`} className="text-xs font-medium text-blue-400 transition-all hover:text-blue-300">
                    View details
                  </Link>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(proposal.id)}
                      disabled={deletingId === proposal.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-60"
                      title="Delete event"
                    >
                      {deletingId === proposal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
