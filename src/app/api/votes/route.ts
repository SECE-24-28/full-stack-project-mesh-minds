import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { proposalId } = await request.json();
  if (!proposalId) {
    return NextResponse.json({ message: 'proposalId is required' }, { status: 400 });
  }

  const existing = await prisma.vote.findUnique({
    where: { proposalId_userId: { proposalId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await prisma.vote.create({ data: { proposalId, userId: session.user.id } });
  return NextResponse.json({ voted: true });
}
