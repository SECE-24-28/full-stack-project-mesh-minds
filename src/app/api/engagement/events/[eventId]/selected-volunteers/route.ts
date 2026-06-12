import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const volunteers = await prisma.volunteerApplication.findMany({
    where: { eventId, status: 'SELECTED' },
    include: { student: { select: { name: true, email: true, department: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    volunteers: volunteers.map((v) => ({
      id: v.id,
      studentName: v.student.name,
      skill: v.skill,
      status: v.status,
      department: v.student.department,
    })),
  });
}
