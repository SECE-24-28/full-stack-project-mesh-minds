import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const UPCOMING_STATUSES = ['PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ACCEPTED'];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const events = await prisma.eventProposal.findMany({
    where: { status: { in: UPCOMING_STATUSES as any } },
    orderBy: { startDate: 'asc' },
    include: {
      author: { select: { name: true, department: true } },
      mentorFaculty: { select: { name: true } },
      _count: { select: { votes: true, registrations: true } },
      votes: { where: { userId }, select: { id: true } },
      registrations: { where: { userId }, select: { id: true } },
    },
  });

  const formatted = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    expectedAudience: e.expectedAudience,
    budget: e.budget,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    venue: e.venue,
    coverImage: e.coverImage,
    status: e.status,
    authorId: e.authorId,
    authorName: e.author.name,
    authorDepartment: e.author.department,
    mentorFacultyName: e.mentorFaculty?.name ?? null,
    participantLimit: e.participantLimit,
    requiredVolunteers: e.requiredVolunteers,
    voteCount: e._count.votes,
    registrationCount: e._count.registrations,
    hasVoted: e.votes.length > 0,
    isRegistered: e.registrations.length > 0,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({ events: formatted });
}
