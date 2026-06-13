'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign } from 'lucide-react';

interface PendingEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string; authorName: string; authorDepartment?: string; votes: number;
}

export default function AdminPendingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setLoading(true);
    fetch('/api/admin/pending-events')
      .then((r) => r.json())
      .then((p) => setPending(p.events || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
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
    setPending((e) => e.filter((ev) => ev.id !== id));
    toast.success(action === 'approve' ? 'Event approved! Moved to Upcoming Events.' : 'Event rejected');
  }

  if (sessionLoading || loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-up space-y-6" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Pending Events</h1>
        <p className="page-subtitle">Review and approve event proposals awaiting your decision</p>
      </div>

      {pending.length === 0 ? (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
