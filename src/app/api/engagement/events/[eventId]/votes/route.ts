import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PointsService } from '@/lib/engagement/points.service';
import { NotificationService } from '@/lib/engagement/notification.service';

const VOTABLE_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED'];

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const event = await prisma.eventProposal.findUnique({ where: { id: eventId }, select: { id: true, status: true, authorId: true, title: true } });
  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  if (!VOTABLE_STATUSES.includes(event.status)) {
    return NextResponse.json({ message: 'Voting is disabled for this event status' }, { status: 403 });
  }

  const existing = await prisma.vote.findUnique({
    where: { proposalId_userId: { proposalId: eventId, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ message: 'Already voted' }, { status: 409 });

  await prisma.vote.create({ data: { proposalId: eventId, userId: session.user.id } });

  const voteCount = await prisma.vote.count({ where: { proposalId: eventId } });
  await PointsService.calculateVotePoints(event.authorId, voteCount);

  await NotificationService.send(event.authorId, 'New Vote!', `Your event "${event.title}" received a new vote.`, eventId);

  return NextResponse.json({ voted: true, voteCount });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const vote = await prisma.vote.findUnique({
    where: { proposalId_userId: { proposalId: eventId, userId: session.user.id } },
  });
  if (!vote) return NextResponse.json({ message: 'Vote not found' }, { status: 404 });

  await prisma.vote.delete({ where: { id: vote.id } });
  const voteCount = await prisma.vote.count({ where: { proposalId: eventId } });
  return NextResponse.json({ voted: false, voteCount });
}

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const votes = await prisma.vote.findMany({
    where: { proposalId: eventId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ votes, count: votes.length });
}
