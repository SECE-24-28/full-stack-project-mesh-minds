import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ message: 'Content is required' }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const updated = await prisma.comment.update({ where: { id }, data: { content: content.trim() } });
  return NextResponse.json({ comment: { id: updated.id, content: updated.content, updatedAt: updated.updatedAt.toISOString() } });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ message: 'Deleted' });
}
