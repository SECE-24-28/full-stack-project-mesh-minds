import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const events = await prisma.eventProposal.findMany({
    where: { status: 'ACCEPTED' },
    orderBy: { endDate: 'asc' },
    select: {
      id: true, title: true, description: true, category: true,
      expectedAudience: true, budget: true, venue: true,
      startDate: true, endDate: true, authorId: true,
      author: { select: { name: true, department: true } },
    },
  });

  const formatted = events.map((e) => ({
    ...e,
    authorName: e.author.name,
    authorDepartment: e.author.department,
  }));

  return NextResponse.json({ events: formatted });
}
