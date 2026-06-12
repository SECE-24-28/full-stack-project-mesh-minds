import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const events = await prisma.eventProposal.findMany({
    where: {
      status: 'PENDING_ADMIN_APPROVAL',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      expectedAudience: true,
      budget: true,
      venue: true,
      startDate: true,
      endDate: true,
      authorId: true,
      _count: { select: { votes: true } },
    },
  });

  return NextResponse.json({ events });
}