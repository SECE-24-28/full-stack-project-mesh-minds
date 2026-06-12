import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ message: 'Invalid verification link' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });

  return NextResponse.redirect(new URL('/auth?verified=true', request.url));
}
