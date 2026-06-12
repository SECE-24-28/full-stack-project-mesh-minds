import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'STUDENT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const faculty = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    select: { id: true, name: true, department: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ faculty });
}