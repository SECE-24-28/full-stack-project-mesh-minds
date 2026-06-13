'use client';

import { useState } from 'react';
import { Send, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string; content: string; authorName: string;
  authorRole: string; userId: string; createdAt: string; replies?: Comment[];
}
interface Props { eventId: string; initialComments: Comment[]; currentUserId?: string; }

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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
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
            className="saas-textarea flex-1 resize-none"
            style={{ minHeight: 'unset' }}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="btn-primary self-end flex-shrink-0"
            style={{ height: 44, padding: '0 16px' }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
      ) : (
        comments.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl px-4 py-4"
            style={{ background: 'var(--role-soft)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{c.authorName}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'var(--role-soft2)', color: 'var(--role-accent)' }}
                >
                  {c.authorRole}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {currentUserId === c.userId && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ id: c.id, content: c.content })}
                    className="p-1.5 rounded-lg hover:bg-white transition-all" style={{ color: 'var(--text-muted)' }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {editing?.id === c.id ? (
              <div className="flex gap-2 mt-2">
                <input
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="saas-input flex-1" style={{ height: 38 }}
                />
                <button onClick={() => handleEdit(c.id, editing.content)}
                  className="btn-primary" style={{ height: 38, padding: '0 14px', fontSize: 12 }}>Save</button>
                <button onClick={() => setEditing(null)}
                  className="btn-secondary" style={{ height: 38, padding: '0 14px', fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{c.content}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
