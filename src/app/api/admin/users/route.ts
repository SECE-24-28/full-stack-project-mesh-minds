import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'FACULTY', 'ADMIN'] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}