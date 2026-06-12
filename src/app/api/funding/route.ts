import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { proposalId, amount } = await request.json();
  if (!proposalId || !amount) {
    return NextResponse.json({ message: 'proposalId and amount are required' }, { status: 400 });
  }

  const contribution = await prisma.fundingContribution.create({
    data: {
      proposalId,
      amount: Number(amount),
      contributorId: session.user.id,
    },
    include: { contributor: { select: { name: true } } },
  });

  return NextResponse.json({
    contribution: {
      id: contribution.id,
      amount: contribution.amount,
      proposalId: contribution.proposalId,
      contributor: contribution.contributor.name,
      date: contribution.contributionDate.toISOString(),
    },
  });
}
