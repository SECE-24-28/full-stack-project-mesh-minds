'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { Calendar, MapPin, Users, ThumbsUp, Search, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface UpcomingEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; startDate: string; endDate: string;
  venue: string; coverImage?: string | null; status: string;
  authorName: string; authorDepartment?: string | null;
  participantLimit?: number | null; voteCount: number;
  registrationCount: number; hasVoted: boolean; isRegistered: boolean;
}

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', cls: 'badge badge-pending',  icon: Clock },
  PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',   cls: 'badge badge-review',   icon: Clock },
  ACCEPTED:                 { label: 'Accepted',        cls: 'badge badge-accepted', icon: CheckCircle },
};

const CAT_COLORS: Record<string, string> = {
  Technical: '#6366F1', Cultural: '#EC4899', Sports: '#F97316',
  Workshop: '#F59E0B', Seminar: '#8B5CF6', Hackathon: '#3B9EFF',
  'Community Service': '#4DC96A',
};

export default function UpcomingEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    fetch('/api/upcoming-events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load events'); setLoading(false); });
  }, [session, sessionLoading, router]);

  const filtered = useMemo(() => events.filter((e) => {
    const q = search.toLowerCase();
    return (
      (!search || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) &&
      (filterStatus === 'ALL' || e.status === filterStatus) &&
      (filterCategory === 'ALL' || e.category === filterCategory)
    );
  }), [events, search, filterStatus, filterCategory]);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))], [events]);

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">Browse all pending and accepted campus events</p>
        </div>
        <div className="text-sm px-4 py-2 rounded-xl font-semibold flex-shrink-0"
          style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)', color: 'var(--role-accent)' }}>
          {filtered.length} events
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            className="saas-input pl-10" style={{ height: '44px' }}
            placeholder="Search events..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="saas-input" style={{ height: '44px', width: 'auto', paddingLeft: 12, paddingRight: 12 }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING_FACULTY_APPROVAL">Faculty Review</option>
          <option value="PENDING_ADMIN_APPROVAL">Admin Review</option>
          <option value="ACCEPTED">Accepted</option>
        </select>
        <select className="saas-input" style={{ height: '44px', width: 'auto', paddingLeft: 12, paddingRight: 12 }}
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--role-soft)' }}>
            <AlertCircle className="h-7 w-7" style={{ color: 'var(--role-accent)' }} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>No events found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => {
            const sc = STATUS_CFG[event.status];
            const StatusIcon = sc?.icon ?? Clock;
            const catColor = CAT_COLORS[event.category] ?? '#6366F1';
            const spotsLeft = event.participantLimit ? event.participantLimit - event.registrationCount : null;

            return (
              <Link key={event.id} href={`/upcoming-events/${event.id}`} className="event-card" style={{ textDecoration: 'none' }}>
                {/* Thumb */}
                <div className="event-card-thumb">
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg, ${catColor}12 0%, var(--role-soft) 100%)` }}>
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${catColor}18`, border: `1.5px solid ${catColor}25` }}>
                        <Calendar className="h-6 w-6" style={{ color: catColor }} />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${catColor}15`, color: catColor }}>{event.category}</span>
                    </div>
                  )}
                  {/* Registered pill */}
                  {event.isRegistered && (
                    <div className="absolute top-3 right-3">
                      <span className="badge badge-accepted text-[10px]">✓ Registered</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-[15px] font-bold leading-snug flex-1 line-clamp-1"
                      style={{ color: 'var(--text-heading)' }}>{event.title}</h3>
                    {sc && <span className={`${sc.cls} flex-shrink-0 flex items-center gap-1`}>
                      <StatusIcon className="h-2.5 w-2.5" />{sc.label}
                    </span>}
                  </div>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{event.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    {[
                      { icon: MapPin,   text: event.venue },
                      { icon: Calendar, text: new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                      { icon: ThumbsUp, text: `${event.voteCount} votes` },
                      { icon: Users,    text: spotsLeft !== null ? (spotsLeft > 0 ? `${spotsLeft} spots` : 'Full') : `${event.registrationCount} joined` },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--role-accent)', opacity: 0.7 }} />
                        <span className="truncate">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid var(--card-border)' }}>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {event.authorName}{event.authorDepartment ? ` · ${event.authorDepartment}` : ''}
                  </p>
                  <span className="text-xs font-semibold" style={{ color: 'var(--role-accent)' }}>View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
