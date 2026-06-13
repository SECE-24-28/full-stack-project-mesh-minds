'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, Check, X } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  proposalId?: string | null;
}

export function Topbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    fetch('/api/engagement/notifications')
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []));
  }, [session]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await fetch('/api/engagement/notifications', { method: 'PATCH' });
    setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })));
  }

  function handleNotifClick(n: Notification) {
    if (!n.isRead) markAllRead();
    setOpen(false);
    if (n.proposalId) {
      const role = session?.user.role;
      if (role === 'FACULTY') router.push('/faculty/pending-events');
      else router.push(`/proposals/${n.proposalId}`);
    }
  }

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-end gap-2 border-b border-[var(--border)] bg-[var(--card,#fff)] px-6"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>

      {/* Calendar shortcut */}
      <button
        onClick={() => router.push(session?.user.role === 'ADMIN' ? '/admin/calendar' : '/calendar')}
        title="Calendar"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[#64748B] transition-all hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]"
      >
        <Calendar className="h-4 w-4" />
      </button>

      {/* Notification Bell */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[#64748B] transition-all hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-[#E9ECF5] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 py-3">
              <p className="text-sm font-semibold text-[#0F172A]">Notifications</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-[var(--role-accent)] hover:opacity-80">
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[#94A3B8] hover:text-[#64748B]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F8F9FC]">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#94A3B8]">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#F8F9FC] ${!n.isRead ? 'bg-[var(--role-soft,#F5F6FF)]' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1E293B] leading-snug">{n.title}</p>
                        <p className="mt-0.5 text-xs text-[#64748B] line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-[#94A3B8]">
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
