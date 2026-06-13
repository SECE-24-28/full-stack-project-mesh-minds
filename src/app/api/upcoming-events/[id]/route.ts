import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  const event = await prisma.eventProposal.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, department: true } },
      mentorFaculty: { select: { name: true } },
      _count: { select: { votes: true, registrations: true } },
      votes: { where: { userId }, select: { id: true } },
      registrations: { where: { userId }, select: { id: true } },
      volunteerApplications: { where: { studentId: userId }, select: { id: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      expectedAudience: event.expectedAudience,
      budget: event.budget,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      venue: event.venue,
      coverImage: event.coverImage,
      status: event.status,
      authorId: event.authorId,
      authorName: event.author.name,
      authorDepartment: event.author.department,
      mentorFacultyName: event.mentorFaculty?.name ?? null,
      participantLimit: event.participantLimit,
      requiredVolunteers: event.requiredVolunteers,
      voteCount: event._count.votes,
      registrationCount: event._count.registrations,
      hasVoted: event.votes.length > 0,
      isRegistered: event.registrations.length > 0,
      createdAt: event.createdAt.toISOString(),
    },
    hasAppliedVolunteer: event.volunteerApplications.length > 0,
    comments: event.comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorName: c.user.name,
      authorRole: c.user.role,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
