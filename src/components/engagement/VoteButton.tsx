'use client';

import { useState } from 'react';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { eventId: string; initialCount: number; initialVoted: boolean; disabled?: boolean; }

export function VoteButton({ eventId, initialCount, initialVoted, disabled }: Props) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    setLoading(true);
    const res = await fetch(`/api/engagement/events/${eventId}/votes`, { method: voted ? 'DELETE' : 'POST' });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message ?? 'Vote failed'); return; }
    const d = await res.json();
    setVoted(d.voted);
    setCount(d.voteCount);
    toast.success(d.voted ? 'Vote added!' : 'Vote removed');
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading || disabled}
      className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
      style={
        voted
          ? { background: 'var(--role-soft)', border: '1.5px solid var(--role-secondary)', color: 'var(--role-accent)' }
          : { background: '#FFFFFF', border: '1px solid #E9ECF5', color: '#475569' }
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
      {count} {voted ? 'Voted' : 'Vote'}
    </button>
  );
}
