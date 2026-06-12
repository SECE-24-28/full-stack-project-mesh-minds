import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare, ThumbsUp, Users } from 'lucide-react';
import Link from 'next/link';
import { VoteButton } from '@/components/engagement/VoteButton';
import { CommentsSection } from '@/components/engagement/CommentsSection';
import { VolunteerApplyForm } from '@/components/engagement/VolunteerApplyForm';

export default async function EventEngagementPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { eventId } = await params;
  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
    include: {
      author: { select: { name: true } },
      _count: { select: { votes: true, comments: true } },
    },
  });
  if (!event) notFound();

  const [userVote, comments] = await Promise.all([
    prisma.vote.findUnique({
      where: { proposalId_userId: { proposalId: eventId, userId: session.user.id } },
    }),
    prisma.comment.findMany({
      where: { proposalId: eventId, parentId: null },
      include: {
        user: { select: { name: true, role: true } },
        replies: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const votableStatuses = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED'];
  const commentableStatuses = [...votableStatuses, 'COMPLETED'];
  const canVote = votableStatuses.includes(event.status);
  const canComment = commentableStatuses.includes(event.status);
  const canVolunteer = session.user.role === 'STUDENT' && event.status === 'ACCEPTED';

  const formattedComments = comments.map((c) => ({
    id: c.id,
    content: c.content,
    authorName: c.user.name,
    authorRole: c.user.role,
    userId: c.userId,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      authorName: r.user.name,
      authorRole: r.user.role,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="animate-fade-in p-8">
      <Link href="/proposals" className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </Link>

      <div className="mb-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{event.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{event.description}</p>
            <p className="mt-2 text-xs text-slate-600">by {event.author.name} · {event.category}</p>
          </div>
          <VoteButton
            eventId={eventId}
            initialCount={event._count.votes}
            initialVoted={!!userVote}
            disabled={!canVote}
          />
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{event._count.votes} votes</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{event._count.comments} comments</span>
          <span className={`rounded-full px-2.5 py-0.5 font-medium ${event.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
            {event.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {canComment && (
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-white">
                {event.status === 'COMPLETED' ? 'Feedback' : 'Discussion'}
              </h2>
            </div>
            <CommentsSection
              eventId={eventId}
              initialComments={formattedComments}
              currentUserId={session.user.id}
            />
          </div>
        )}

        <div className="space-y-6">
          {canVolunteer && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <h2 className="font-semibold text-white">Volunteer</h2>
              </div>
              <VolunteerApplyForm eventId={eventId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
