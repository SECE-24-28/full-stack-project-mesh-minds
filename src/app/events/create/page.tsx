'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Upload, FileText } from 'lucide-react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Community Service'];

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical',
    expectedAudience: '100', budget: '1000',
    startDate: '', startTime: '10:00', endDate: '', endTime: '16:00',
    venue: '', participantLimit: '50', requiredVolunteers: '5',
    mentorFacultyId: '', thumbnail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faculty, setFaculty] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role === 'STUDENT') {
      fetch('/api/users/faculty')
        .then((r) => r.json())
        .then((d) => setFaculty(d.faculty || []))
        .catch(() => {});
    }
  }, [session, sessionLoading, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) { toast.error('Failed to upload image'); return; }
      const { url } = await res.json();
      setForm((f) => ({ ...f, thumbnail: url }));
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date();
    const start = new Date(`${form.startDate}T${form.startTime}`);
    const end   = new Date(`${form.endDate}T${form.endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) { toast.error('Invalid date/time'); return; }
    if (start <= now) { toast.error('Start date must be in the future'); return; }
    if (end <= start) { toast.error('End must be after start'); return; }
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes < 30) { toast.error('Event duration must be at least 30 minutes'); return; }
    if (session?.user.role === 'STUDENT' && !form.mentorFacultyId) { toast.error('Please select a faculty mentor'); return; }

    setSubmitting(true);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, description: form.description, category: form.category,
        venue: form.venue, startDate: start.toISOString(), endDate: end.toISOString(),
        expectedAudience: Number(form.expectedAudience), budget: Number(form.budget),
        participantLimit: Number(form.participantLimit), requiredVolunteers: Number(form.requiredVolunteers),
        mentorFacultyId: form.mentorFacultyId || null, thumbnail: form.thumbnail || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed to create event'); return; }
    toast.success('Proposal submitted!');
    router.push('/proposals');
  }

  if (!session) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--role-soft)' }}>
            <FileText className="h-5 w-5" style={{ color: 'var(--role-accent)' }} />
          </div>
          <div>
            <h1 className="page-title">New Event Proposal</h1>
            <p className="page-subtitle">Submit a new event proposal for review</p>
          </div>
        </div>
      </div>

      <div className="saas-card p-7 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="saas-label">Event Title <span className="text-red-400">*</span></label>
            <input className="saas-input" placeholder="e.g. AI Hackathon 2026"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          {/* Description */}
          <div>
            <label className="saas-label">Description <span className="text-red-400">*</span></label>
            <textarea className="saas-textarea" rows={4} placeholder="Describe your event in detail..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>

          {/* Category + Venue */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="saas-label">Category</label>
              <select className="saas-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="saas-label">Venue <span className="text-red-400">*</span></label>
              <input className="saas-input" placeholder="e.g. Main Auditorium"
                value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
            </div>
          </div>

          {/* Start Date + Time */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="saas-label">Start Date <span className="text-red-400">*</span></label>
              <input type="date" className="saas-input" min={today}
                value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="saas-label">Start Time <span className="text-red-400">*</span></label>
              <input type="time" className="saas-input"
                value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
          </div>

          {/* End Date + Time */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="saas-label">End Date <span className="text-red-400">*</span></label>
              <input type="date" className="saas-input" min={form.startDate || today}
                value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
            <div>
              <label className="saas-label">End Time <span className="text-red-400">*</span></label>
              <input type="time" className="saas-input"
                value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          {/* Numbers */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="saas-label">Expected Audience</label>
              <input type="number" min={0} className="saas-input"
                value={form.expectedAudience} onChange={(e) => setForm({ ...form, expectedAudience: e.target.value })} required />
            </div>
            <div>
              <label className="saas-label">Budget (₹)</label>
              <input type="number" min={0} className="saas-input"
                value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required />
            </div>
            <div>
              <label className="saas-label">Participant Limit</label>
              <input type="number" min={0} className="saas-input"
                value={form.participantLimit} onChange={(e) => setForm({ ...form, participantLimit: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="saas-label">Required Volunteers</label>
            <input type="number" min={0} className="saas-input" style={{ maxWidth: 200 }}
              value={form.requiredVolunteers} onChange={(e) => setForm({ ...form, requiredVolunteers: e.target.value })} />
          </div>

          {/* Faculty Mentor */}
          {session?.user?.role === 'STUDENT' && (
            <div>
              <label className="saas-label">Faculty Mentor <span className="text-red-400">*</span></label>
              <select className="saas-input" value={form.mentorFacultyId}
                onChange={(e) => setForm({ ...form, mentorFacultyId: e.target.value })} required>
                <option value="">Select a faculty mentor...</option>
                {faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <label className="saas-label">Cover Image</label>
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#F8F9FC] transition-all"
            >
              <Upload className="h-4 w-4" style={{ color: 'var(--role-accent)' }} />
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.thumbnail && (
              <img src={form.thumbnail} alt="Thumbnail preview" className="mt-3 h-40 w-full rounded-2xl object-cover border border-[#E9ECF5]" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-[#F1F5F9]">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
