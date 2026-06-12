import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const COMMENTABLE_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED', 'COMPLETED'];

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ message: 'Content is required' }, { status: 400 });

  const event = await prisma.eventProposal.findUnique({ where: { id: eventId }, select: { status: true } });
  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  if (!COMMENTABLE_STATUSES.includes(event.status)) {
    return NextResponse.json({ message: 'Comments not allowed for this event status' }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), proposalId: eventId, userId: session.user.id },
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      eventId: comment.proposalId,
      userId: comment.userId,
      authorName: comment.user.name,
      authorRole: comment.user.role,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const comments = await prisma.comment.findMany({
    where: { proposalId: eventId, parentId: null },
    include: {
      user: { select: { name: true, role: true } },
      replies: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  type RichComment = typeof comments[0];

  const format = (c: RichComment | RichComment['replies'][0]) => ({
    id: c.id,
    content: c.content,
    eventId: c.proposalId,
    userId: c.userId,
    authorName: c.user.name,
    authorRole: c.user.role,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  });

  return NextResponse.json({
    comments: comments.map((c) => ({ ...format(c), replies: c.replies.map(format) })),
  });
}
