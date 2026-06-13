'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Proposal } from '@/types';
import {
  Calendar, DollarSign, FileText, Loader2, MapPin, Plus, Trash2,
  Users, Tag, TrendingUp, Search,
} from 'lucide-react';

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

const PENDING_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL'];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Technical:         { bg: '#EFF6FF', text: '#2563EB' },
  Cultural:          { bg: '#FDF2F8', text: '#BE185D' },
  Sports:            { bg: '#FFF7ED', text: '#C2410C' },
  Workshop:          { bg: '#FFFBEB', text: '#B45309' },
  Seminar:           { bg: '#F5F3FF', text: '#6D28D9' },
  Hackathon:         { bg: '#ECFEFF', text: '#0E7490' },
  'Community Service': { bg: '#F0FDF4', text: '#15803D' },
};

export default function ProposalsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isStudent = session?.user?.role === 'STUDENT';

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => toast.error('Failed to load proposals'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, router]);

  const visible = useMemo(() => {
    if (!session?.user) return [];
    const base = session.user.role === 'ADMIN'
      ? proposals
      : proposals.filter((p) => p.authorId === session.user.id);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [proposals, session, search]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.message || 'Delete failed'); return; }
    setProposals((p) => p.filter((e) => e.id !== id));
    toast.success('Proposal deleted');
  }

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{isAdmin ? 'All Proposals' : 'My Proposals'}</h1>
          <p className="page-subtitle">Track proposal status from submission through approval</p>
        </div>
        {!isAdmin && (
          <Link href="/events/create" className="btn-primary flex-shrink-0">
            <Plus className="h-4 w-4" />
            New Proposal
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94A3B8' }} />
        <input
          type="text"
          placeholder="Search proposals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="saas-input pl-11"
          style={{ height: '44px' }}
        />
      </div>

      {visible.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--role-soft)' }}>
            <FileText className="h-7 w-7" style={{ color: 'var(--role-accent)' }} />
          </div>
          <p className="font-semibold text-[#1E293B]">No proposals found</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            {search ? 'Try a different search term' : 'Submit a new proposal to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((proposal) => {
            const catColor = categoryColors[proposal.category] ?? { bg: '#F1F5F9', text: '#64748B' };
            const canDelete = (session?.user.role === 'ADMIN' || proposal.authorId === session?.user.id)
                            && PENDING_STATUSES.includes(proposal.status);

            return (
              <div key={proposal.id} className="event-card">
                {/* Thumb */}
                <div className="event-card-thumb" style={{ background: `linear-gradient(135deg, ${catColor.bg} 0%, #F8F9FC 100%)` }}>
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: catColor.bg, border: `1.5px solid ${catColor.text}20` }}>
                      <FileText className="h-6 w-6" style={{ color: catColor.text }} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: catColor.bg, color: catColor.text }}>
                      {proposal.category}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[#0F172A] text-[15px] leading-tight line-clamp-1 flex-1">{proposal.title}</h3>
                    <span className={statusBadge[proposal.status] ?? 'badge badge-pending'}>
                      {statusLabel[proposal.status] ?? proposal.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-2 mb-4">{proposal.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    {[
                      { icon: Users,      text: `${proposal.expectedAudience} expected` },
                      { icon: DollarSign, text: `₹${Number(proposal.budget).toLocaleString()}` },
                      { icon: MapPin,     text: proposal.venue },
                      { icon: Calendar,   text: new Date(proposal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[#F1F5F9] px-5 py-3">
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="text-sm font-semibold flex items-center gap-1 hover:underline transition-all"
                    style={{ color: 'var(--role-accent)' }}
                  >
                    View details
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Link>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(proposal.id)}
                      disabled={deletingId === proposal.id}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#F1F5F9] text-[#94A3B8] hover:bg-red-50 hover:text-red-500 hover:border-red-100 disabled:opacity-50 transition-all"
                    >
                      {deletingId === proposal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
