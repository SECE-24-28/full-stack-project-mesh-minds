'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Calendar, MapPin, Users, ThumbsUp, Search, Filter,
  Loader2, Clock, CheckCircle, AlertCircle,
} from 'lucide-react';

interface UpcomingEvent {
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
  authorName: string;
  authorDepartment?: string | null;
  mentorFacultyName?: string | null;
  participantLimit?: number | null;
  voteCount: number;
  registrationCount: number;
  hasVoted: boolean;
  isRegistered: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING_FACULTY_APPROVAL: { label: 'Faculty Review', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   icon: Clock },
  ACCEPTED:                 { label: 'Accepted',        cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
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
      .then((d) => setEvents(d.events || []))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, router]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
      const matchCat = filterCategory === 'ALL' || e.category === filterCategory;
      return matchSearch && matchStatus && matchCat;
    });
  }, [events, search, filterStatus, filterCategory]);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))], [events]);

  if (loading || sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upcoming Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse all pending and accepted campus events. Click an event to vote or register.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-500" />
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option className="bg-slate-900" value="ALL">All Statuses</option>
          <option className="bg-slate-900" value="PENDING_FACULTY_APPROVAL">Faculty Review</option>
          <option className="bg-slate-900" value="PENDING_ADMIN_APPROVAL">Admin Review</option>
          <option className="bg-slate-900" value="ACCEPTED">Accepted</option>
        </select>

        <select
          className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option className="bg-slate-900" value="ALL">All Categories</option>
          {categories.map((c) => (
            <option className="bg-slate-900" key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="mb-4 text-xs text-slate-500">{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/50 py-20 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-slate-600" />
          <p className="font-medium text-slate-400">No events found</p>
          <p className="mt-1 text-sm text-slate-600">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => {
            const sc = STATUS_CONFIG[event.status];
            const StatusIcon = sc?.icon ?? Clock;
            const spotsLeft = event.participantLimit
              ? event.participantLimit - event.registrationCount
              : null;

            return (
              <Link
                key={event.id}
                href={`/upcoming-events/${event.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 transition-all duration-200 hover:border-white/12 hover:bg-slate-900/80 hover:-translate-y-0.5"
              >
                {/* Cover image */}
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <Calendar className="h-10 w-10 text-slate-700" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[event.category] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {event.category}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc?.cls ?? ''}`}>
                      <StatusIcon className="h-3 w-3" />
                      {sc?.label}
                    </span>
                    {event.isRegistered && (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Registered ✓</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-100 line-clamp-1 group-hover:text-white">{event.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-500 line-clamp-2">{event.description}</p>

                  {/* Meta */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 flex-shrink-0" />
                      {event.voteCount} votes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      {spotsLeft !== null
                        ? spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'
                        : `${event.registrationCount} registered`}
                    </div>
                  </div>

                  <p className="mt-3 truncate text-xs text-slate-600">by {event.authorName}{event.authorDepartment ? ` · ${event.authorDepartment}` : ''}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
