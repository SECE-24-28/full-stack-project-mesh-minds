import { prisma } from '@/lib/prisma';

export const NotificationService = {
  async send(userId: string, title: string, message: string, proposalId?: string) {
    await prisma.notification.create({
      data: { userId, title, message, ...(proposalId && { proposalId }) },
    });
  },
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },
  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
