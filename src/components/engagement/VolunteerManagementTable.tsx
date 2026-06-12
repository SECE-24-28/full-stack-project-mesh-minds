'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  studentName: string;
  skill: string;
  reason: string;
  status: string;
  department?: string;
}

interface Props {
  applications: Application[];
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  SELECTED: 'bg-emerald-500/20 text-emerald-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

export function VolunteerManagementTable({ applications: initial }: Props) {
  const [apps, setApps] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(id: string, action: 'select' | 'reject') {
    setLoading(id + action);
    const res = await fetch(`/api/engagement/volunteers/${id}/${action}`, { method: 'PATCH' });
    setLoading(null);
    if (!res.ok) { toast.error('Action failed'); return; }
    const newStatus = action === 'select' ? 'SELECTED' : 'REJECTED';
    setApps((a) => a.map((app) => app.id === id ? { ...app, status: newStatus } : app));
    toast.success(action === 'select' ? 'Volunteer selected' : 'Application rejected');
  }

  if (apps.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-600">No volunteer applications yet.</p>;
  }

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <div key={app.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-200">{app.studentName}</p>
              {app.department && <span className="text-xs text-slate-500">{app.department}</span>}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[app.status] ?? statusBadge.PENDING}`}>{app.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-blue-400">Skill: {app.skill}</p>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{app.reason}</p>
          </div>
          {app.status === 'PENDING' && (
            <div className="ml-4 flex gap-2">
              <button
                onClick={() => handleAction(app.id, 'select')}
                disabled={loading === app.id + 'select'}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {loading === app.id + 'select' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Select
              </button>
              <button
                onClick={() => handleAction(app.id, 'reject')}
                disabled={loading === app.id + 'reject'}
                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {loading === app.id + 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
