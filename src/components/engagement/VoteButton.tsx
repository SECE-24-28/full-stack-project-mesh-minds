'use client';

import { useState } from 'react';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  eventId: string;
  initialCount: number;
  initialVoted: boolean;
  disabled?: boolean;
}

export function VoteButton({ eventId, initialCount, initialVoted, disabled }: Props) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    setLoading(true);
    const method = voted ? 'DELETE' : 'POST';
    const res = await fetch(`/api/engagement/events/${eventId}/votes`, { method });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message ?? 'Vote failed');
      return;
    }
    const data = await res.json();
    setVoted(data.voted);
    setCount(data.voteCount);
    toast.success(data.voted ? 'Vote added!' : 'Vote removed');
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading || disabled}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
        voted
          ? 'border-blue-500/40 bg-blue-500/20 text-blue-300'
          : 'border-white/10 bg-white/5 text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
      {count}
    </button>
  );
}
