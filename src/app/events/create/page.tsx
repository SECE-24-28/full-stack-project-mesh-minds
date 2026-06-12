'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Upload } from 'lucide-react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Community Service'];

const inputCls = 'w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-white/20 focus:bg-white/8';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technical',
    expectedAudience: '100',
    budget: '1000',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '16:00',
    venue: '',
    participantLimit: '50',
    requiredVolunteers: '5',
    mentorFacultyId: '',
    thumbnail: '',
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
        .then((data) => setFaculty(data.faculty || []))
        .catch(() => {});
    }
  }, [session, sessionLoading, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) { toast.error('Failed to upload image'); setUploading(false); return; }
      const { url } = await res.json();
      setForm((f) => ({ ...f, thumbnail: url }));
    } catch {
      toast.error('Failed to upload image');
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const now = new Date();
    const start = new Date(`${form.startDate}T${form.startTime}`);
    const end = new Date(`${form.endDate}T${form.endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Invalid date and time');
      return;
    }
    if (start <= now) {
      toast.error('Invalid date and time');
      return;
    }
    if (end <= start) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    const audience = Number(form.expectedAudience);
    const budget = Number(form.budget);
    const participantLimit = Number(form.participantLimit);
    const requiredVolunteers = Number(form.requiredVolunteers);

    if (audience < 0) { toast.error('Expected audience cannot be negative'); return; }
    if (budget < 0) { toast.error('Budget cannot be negative'); return; }
    if (participantLimit < 0) { toast.error('Participant limit cannot be negative'); return; }
    if (requiredVolunteers < 0) { toast.error('Volunteer requirement cannot be negative'); return; }

    if (session?.user.role === 'STUDENT' && !form.mentorFacultyId) {
      toast.error('Please choose a faculty mentor');
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        venue: form.venue,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        expectedAudience: audience,
        budget,
        participantLimit,
        requiredVolunteers,
        mentorFacultyId: form.mentorFacultyId || null,
        thumbnail: form.thumbnail || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || 'Failed to create event');
      return;
    }

    toast.success('Proposal submitted!');
    router.push('/proposals');
  }

  if (!session) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Proposal</h1>
        <p className="mt-1 text-sm text-slate-500">Submit a new event proposal.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div>
          <label className={labelCls}>Event Title</label>
          <input
            className={inputCls}
            placeholder="e.g. AI Hackathon 2026"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            placeholder="Describe your event..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Category</label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option className="bg-slate-950 text-white" key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Venue</label>
            <input
              className={inputCls}
              placeholder="Location"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Start Date + Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Event Start Date</label>
            <input
              type="date"
              className={inputCls}
              min={today}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Start Time</label>
            <input
              type="time"
              className={inputCls}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </div>
        </div>

        {/* End Date + Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Event End Date</label>
            <input
              type="date"
              className={inputCls}
              min={form.startDate || today}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>End Time</label>
            <input
              type="time"
              className={inputCls}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Expected Audience</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.expectedAudience}
              onChange={(e) => setForm({ ...form, expectedAudience: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Budget ($)</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Participant Limit</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.participantLimit}
              onChange={(e) => setForm({ ...form, participantLimit: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Volunteer Requirement</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.requiredVolunteers}
            onChange={(e) => setForm({ ...form, requiredVolunteers: e.target.value })}
          />
        </div>

        {session?.user?.role === 'STUDENT' && (
          <div>
            <label className={labelCls}>Faculty Mentor</label>
            <select
              className={inputCls}
              value={form.mentorFacultyId}
              onChange={(e) => setForm({ ...form, mentorFacultyId: e.target.value })}
              required
            >
              <option className="bg-slate-950 text-white" value="">Select a faculty mentor</option>
              {faculty.map((f) => (
                <option className="bg-slate-950 text-white" key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Thumbnail Image</label>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          {form.thumbnail && (
            <img src={form.thumbnail} alt="Thumbnail" className="mt-3 h-40 w-full rounded-xl object-cover" />
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}
