import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { proposalId, content, parentId } = await request.json();
  if (!proposalId || !content) {
    return NextResponse.json({ message: 'proposalId and content are required' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      proposalId,
      userId: session.user.id,
      ...(parentId && { parentId }),
    },
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      proposalId: comment.proposalId,
      userId: comment.userId,
      authorName: comment.user.name,
      authorRole: comment.user.role,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
