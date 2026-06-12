import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: epassId } = await params;

  const epass = await prisma.ePass.findUnique({
    where: { id: epassId },
    include: {
      event: {
        select: {
          title: true,
          venue: true,
          startDate: true,
          endDate: true,
        },
      },
      student: {
        select: {
          name: true,
          department: true,
          rollNumber: true,
        },
      },
    },
  });

  if (!epass) {
    return NextResponse.json({ message: 'E-Pass not found' }, { status: 404 });
  }

  if (epass.studentId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    epass: {
      ...epass,
      createdAt: epass.createdAt.toISOString(),
      event: epass.event ? {
        ...epass.event,
        startDate: epass.event.startDate.toISOString(),
        endDate: epass.event.endDate.toISOString(),
      } : null,
      student: epass.student ? {
        ...epass.student,
      } : null,
    },
  });
}
