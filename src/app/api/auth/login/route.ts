import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { email, password, role } = await request.json();

  if (role) {
    const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (user && user.role !== role) {
      return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
    }
  }

  const result = await signIn({ email, password });
  if (!result) {
    return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
  }

  return NextResponse.json({ session: result });
}
