'use client';

import { Bell, Check } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  proposalId?: string | null;
}

interface Props {
  notifications: Notification[];
  role?: string;
}

export function NotificationBell({ notifications: initial, role }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await fetch('/api/engagement/notifications', { method: 'PATCH' });
    setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })));
    toast.success('All marked as read');
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await fetch('/api/engagement/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((notif) => notif.id === n.id ? { ...notif, isRead: true } : notif));
    }
    setOpen(false);

    // Faculty pending review notifications → go to Review Events
    if (role === 'FACULTY' && (n.title.toLowerCase().includes('proposal') || n.title.toLowerCase().includes('review'))) {
      router.push('/faculty/pending-events');
      return;
    }
    // Rating request notification → go to rate page
    if (n.title.toLowerCase().includes('rate') && n.proposalId) {
      router.push(`/proposals/${n.proposalId}`);
      return;
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/8 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-600">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full border-b border-white/5 px-4 py-3 text-left last:border-0 transition-colors hover:bg-white/5 ${n.isRead ? 'opacity-50' : ''}`}
                >
                  <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-600">{new Date(n.createdAt).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
