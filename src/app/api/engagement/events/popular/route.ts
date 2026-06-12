import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const events = await prisma.eventProposal.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      _count: { select: { votes: true } },
    },
    orderBy: { votes: { _count: 'desc' } },
    take: 10,
  });

  const result = events.map((e) => ({
    eventId: e.id,
    eventTitle: e.title,
    category: e.category,
    status: e.status,
    voteCount: e._count.votes,
  }));

  return NextResponse.json({ events: result });
}
