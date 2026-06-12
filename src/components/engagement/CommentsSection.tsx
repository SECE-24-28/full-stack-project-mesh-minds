'use client';

import { useState } from 'react';
import { Send, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  userId: string;
  createdAt: string;
  replies?: Comment[];
}

interface Props {
  eventId: string;
  initialComments: Comment[];
  currentUserId?: string;
}

export function CommentsSection({ eventId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/engagement/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    setSubmitting(false);
    if (!res.ok) { toast.error('Failed to post comment'); return; }
    const { comment } = await res.json();
    setComments((c) => [comment, ...c]);
    setText('');
    toast.success('Comment posted');
  }

  async function handleEdit(id: string, content: string) {
    const res = await fetch(`/api/engagement/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) { toast.error('Failed to update'); return; }
    setComments((c) => c.map((cm) => cm.id === id ? { ...cm, content } : cm));
    setEditing(null);
    toast.success('Comment updated');
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/engagement/comments/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setComments((c) => c.filter((cm) => cm.id !== id));
    toast.success('Comment deleted');
  }

  return (
    <div className="space-y-4">
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="flex items-center gap-1.5 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">{c.authorName}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{c.authorRole}</span>
                <span className="text-xs text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              {currentUserId === c.userId && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ id: c.id, content: c.content })} className="text-slate-500 hover:text-blue-400">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {editing?.id === c.id ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                />
                <button onClick={() => handleEdit(c.id, editing.content)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Save</button>
                <button onClick={() => setEditing(null)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-400">{c.content}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
