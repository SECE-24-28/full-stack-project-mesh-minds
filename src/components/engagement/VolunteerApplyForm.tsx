'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  eventId: string;
  onSuccess?: () => void;
}

export function VolunteerApplyForm({ eventId, onSuccess }: Props) {
  const [skill, setSkill] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/engagement/events/${eventId}/volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, reason }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message ?? 'Application failed');
      return;
    }
    toast.success('Application submitted!');
    setSkill('');
    setReason('');
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/5 bg-white/3 p-6">
      <h3 className="font-semibold text-white">Apply to Volunteer</h3>
      <div>
        <label className="mb-1.5 block text-xs text-slate-400">Your Skill</label>
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          required
          placeholder="e.g. Photography, Web Dev, Event Planning"
          className="w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-slate-400">Why do you want to volunteer?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
          className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Application
      </button>
    </form>
  );
}
