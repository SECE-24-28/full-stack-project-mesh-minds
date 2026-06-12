import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const events = await prisma.eventProposal.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true, title: true, description: true, category: true,
      expectedAudience: true, budget: true, venue: true,
      startDate: true, endDate: true, completedAt: true,
      adminRating: true, mentorRating: true, eventRating: true,
      author: { select: { name: true, department: true } },
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id, title: e.title, description: e.description, category: e.category,
      expectedAudience: e.expectedAudience, budget: e.budget, venue: e.venue,
      startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      authorName: e.author.name, authorDepartment: e.author.department,
      adminRating: e.adminRating, mentorRating: e.mentorRating, eventRating: e.eventRating,
      registrations: e._count.registrations,
    })),
  });
}
