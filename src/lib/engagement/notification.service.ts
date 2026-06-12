import { prisma } from '@/lib/prisma';

export const NotificationService = {
  async send(userId: string, title: string, message: string, proposalId?: string) {
    await prisma.notification.create({
      data: { userId, title, message, ...(proposalId && { proposalId }) },
    });

    // Keep only the latest 10 — delete oldest beyond that
    const all = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (all.length > 10) {
      const toDelete = all.slice(10).map((n) => n.id);
      await prisma.notification.deleteMany({ where: { id: { in: toDelete } } });
    }
  },

  async getUserNotifications(userId: string) {
    // Delete read notifications older than 1 hour
    await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
