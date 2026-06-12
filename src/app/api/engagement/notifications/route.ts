import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const notifications = await NotificationService.getUserNotifications(session.user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await NotificationService.markAllRead(session.user.id);
  return NextResponse.json({ message: 'All marked as read' });
}
