import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const [events, reminders] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { status: 'ACCEPTED' },
      orderBy: { endDate: 'asc' },
      select: {
        id: true, title: true, description: true, category: true,
        expectedAudience: true, budget: true, venue: true,
        startDate: true, endDate: true,
        author: { select: { name: true, department: true } },
        _count: { select: { registrations: true } },
        fundingContributions: {
          select: { id: true, amount: true, contributorId: true, contributor: { select: { name: true } } },
        },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId: session.user.id, roleType: 'PARTICIPANT' },
      select: { eventId: true },
    }),
  ]);

  const remindedSet = new Set(reminders.map((r) => r.eventId));

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id, title: e.title, description: e.description, category: e.category,
      expectedAudience: e.expectedAudience, budget: e.budget, venue: e.venue,
      startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(),
      authorName: e.author.name, authorDepartment: e.author.department,
      registrations: e._count.registrations,
      reminded: remindedSet.has(e.id),
      funding: e.fundingContributions.map((f) => ({
        id: f.id, amount: f.amount, contributor: f.contributor.name,
      })),
    })),
  });
}
