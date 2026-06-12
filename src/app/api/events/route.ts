import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';

const proposalSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  expectedAudience: z.number().int().min(0),
  budget: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  venue: z.string().min(3),
  thumbnail: z.string().url().or(z.literal('')).optional().nullable(),
  participantLimit: z.number().int().min(0).optional().nullable(),
  requiredVolunteers: z.number().int().min(0).optional().nullable(),
  mentorFacultyId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Invalid event date or time' });
    return;
  }

  if (start <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Event date and start time must be in the future' });
  }

  if (end <= start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End time must be after start time' });
  }
});

export async function GET() {
  const proposals = await prisma.eventProposal.findMany({
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
      status: true,
      authorId: true,
      coverImage: true,
      attachments: true,
      participantLimit: true,
      requiredVolunteers: true,
      createdAt: true,
      _count: { select: { votes: true, registrations: true } },
    },
  });

  const authorIds = [...new Set(proposals.map(p => p.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, department: true },
  });
  const authorMap = Object.fromEntries(authors.map(a => [a.id, { name: a.name, department: a.department }]));

  const formatted = proposals.map((p) => ({
    ...p,
    authorName: authorMap[p.authorId]?.name ?? 'Unknown',
    authorDepartment: authorMap[p.authorId]?.department ?? null,
    voteCount: p._count.votes,
    registrationCount: p._count.registrations,
    attachments: p.attachments ? JSON.parse(p.attachments) : [],
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json({ proposals: formatted });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = proposalSchema.parse(body);

    if (session.user.role !== 'STUDENT' && session.user.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Only students and faculty can create event proposals' }, { status: 403 });
    }

    let status: 'PENDING_FACULTY_APPROVAL' | 'PENDING_ADMIN_APPROVAL' = 'PENDING_FACULTY_APPROVAL';
    let mentorId: string | undefined = undefined;

    if (session.user.role === 'STUDENT') {
      if (!parsed.mentorFacultyId) {
        return NextResponse.json({ message: 'Mentor faculty selection is required for students' }, { status: 400 });
      }
      const faculty = await prisma.user.findFirst({
        where: { id: parsed.mentorFacultyId, role: 'FACULTY' },
      });
      if (!faculty) {
        return NextResponse.json({ message: 'Invalid mentor faculty selected' }, { status: 400 });
      }
      mentorId = parsed.mentorFacultyId;
    } else if (session.user.role === 'FACULTY') {
      status = 'PENDING_ADMIN_APPROVAL';
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const created = await tx.eventProposal.create({
        data: {
          title: parsed.title,
          description: parsed.description,
          category: parsed.category,
          expectedAudience: parsed.expectedAudience,
          budget: parsed.budget,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          venue: parsed.venue,
          status,
          authorId: session.user.id,
          attachments: JSON.stringify([]),
          coverImage: parsed.thumbnail || null,
          participantLimit: parsed.participantLimit,
          requiredVolunteers: parsed.requiredVolunteers,
          mentorFacultyId: mentorId,
        },
        include: {
          author: { select: { name: true, department: true } },
          _count: { select: { votes: true, registrations: true } },
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { createdEventsCount: { increment: 1 } },
      });

      await tx.calendarEvent.create({
        data: { userId: session.user.id, eventId: created.id, roleType: 'PROPOSER' },
      });

      if (mentorId) {
        await tx.calendarEvent.create({
          data: { userId: mentorId, eventId: created.id, roleType: 'MENTOR' },
        });
      }

      return created;
    });

    if (mentorId) {
      await NotificationService.send(
        mentorId,
        'Faculty Mentor Request Received',
        `${session.user.name} requested you as mentor for "${proposal.title}".`,
        proposal.id
      );
    }

    const responseData = {
      ...proposal,
      authorName: proposal.author.name,
      authorDepartment: proposal.author.department,
      mentorFacultyName: undefined,
      voteCount: proposal._count.votes,
      registrationCount: proposal._count.registrations,
      attachments: proposal.attachments ? JSON.parse(proposal.attachments) : [],
      startDate: proposal.startDate.toISOString(),
      endDate: proposal.endDate.toISOString(),
      createdAt: proposal.createdAt.toISOString(),
    };

    return NextResponse.json({ proposal: responseData });
  } catch (error) {
    console.error('Proposal creation error:', error);
    return NextResponse.json({ message: 'Invalid proposal payload' }, { status: 400 });
  }
}
