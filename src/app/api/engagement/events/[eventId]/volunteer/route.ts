import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'STUDENT') return NextResponse.json({ message: 'Only students can apply' }, { status: 403 });

  const { eventId } = await params;
  const { skill, reason } = await request.json();
  if (!skill?.trim() || !reason?.trim()) {
    return NextResponse.json({ message: 'Skill and reason are required' }, { status: 400 });
  }

  const event = await prisma.eventProposal.findUnique({ where: { id: eventId }, select: { status: true } });
  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  if (event.status !== 'ACCEPTED') {
    return NextResponse.json({ message: 'Volunteering is only open for accepted events' }, { status: 403 });
  }

  const existing = await prisma.volunteerApplication.findUnique({
    where: { eventId_studentId: { eventId, studentId: session.user.id } },
  });
  if (existing) return NextResponse.json({ message: 'Already applied' }, { status: 409 });

  const application = await prisma.volunteerApplication.create({
    data: { eventId, studentId: session.user.id, skill: skill.trim(), reason: reason.trim() },
  });

  return NextResponse.json({ application }, { status: 201 });
}

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const applications = await prisma.volunteerApplication.findMany({
    where: { eventId },
    include: { student: { select: { id: true, name: true, email: true, department: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ applications });
}
