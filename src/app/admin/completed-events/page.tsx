'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Loader2, CheckCircle, Calendar, MapPin, Users, DollarSign, Star } from 'lucide-react';
import { toast } from 'sonner';

interface CompletedEvent {
  id: string; title: string; description: string; category: string;
  expectedAudience: number; budget: number; venue: string;
  startDate: string; endDate: string; completedAt: string | null;
  authorName: string; authorDepartment: string | null;
  adminRating: number | null; mentorRating: number | null; eventRating: number | null;
  registrations: number;
}

export default function AdminCompletedEventsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetch('/api/admin/completed-events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load'); setLoading(false); });
  }, [session, sessionLoading, router]);

  if (loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
    </div>
  );

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Completed Events</h1>
        <p className="page-subtitle">All events that have been marked as completed</p>
      </div>

      {events.length === 0 ? (
        <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--role-soft)' }}>
            <CheckCircle className="h-7 w-7" style={{ color: 'var(--role-accent)' }} />
          </div>
          <p className="font-semibold text-[#1E293B]">No completed events yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="saas-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">{ev.category}</span>
                    <span className="badge badge-completed">Completed</span>
                    {ev.completedAt && (
                      <span className="text-xs text-[#94A3B8]">on {new Date(ev.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">{ev.title}</h3>
                  <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{ev.description}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">by {ev.authorName}{ev.authorDepartment && ` · ${ev.authorDepartment}`}</p>
                </div>

                {/* Ratings */}
                <div className="flex flex-col gap-1 text-right flex-shrink-0">
                  {ev.adminRating && (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-[#94A3B8]">Admin:</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: ev.adminRating }, (_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-amber-600">{ev.adminRating}/10</span>
                      </div>
                    </div>
                  )}
                  {ev.mentorRating && (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-[#94A3B8]">Mentor:</span>
                      <span className="text-xs font-semibold text-amber-600">{ev.mentorRating}/10</span>
                    </div>
                  )}
                  {ev.eventRating && (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-[#94A3B8]">Overall:</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--role-accent)' }}>{ev.eventRating}/10</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9]">
                {[
                  { icon: Users, text: `${ev.registrations} registered` },
                  { icon: DollarSign, text: `₹${Number(ev.budget).toLocaleString()}` },
                  { icon: MapPin, text: ev.venue },
                  { icon: Calendar, text: new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
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
