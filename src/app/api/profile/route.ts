import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  profileImage: z.string().url().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      profileImage: true,
      points: true,
      rollNumber: true,
      year: true,
      section: true,
      employeeId: true,
      createdEventsCount: true,
      registeredEventsCount: true,
      mentoredEventsCount: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.profileImage !== undefined && { profileImage: parsed.profileImage }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        profileImage: true,
        points: true,
        rollNumber: true,
        year: true,
        section: true,
        employeeId: true,
        createdEventsCount: true,
        registeredEventsCount: true,
        mentoredEventsCount: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'Invalid profile data' }, { status: 400 });
  }
}