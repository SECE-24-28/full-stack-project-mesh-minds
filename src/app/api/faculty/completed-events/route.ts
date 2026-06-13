import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'FACULTY') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const events = await prisma.eventProposal.findMany({
    where: { mentorFacultyId: session.user.id, status: 'COMPLETED', mentorRating: null },
    select: { id: true, title: true, adminRating: true, endDate: true },
    orderBy: { completedAt: 'desc' },
  });

  return NextResponse.json({ events });
}
