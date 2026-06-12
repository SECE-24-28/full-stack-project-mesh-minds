import { prisma } from '@/lib/prisma';

const PENALTY_POINTS = 20;
const CONSECUTIVE_THRESHOLD = 3;

export const PointsPenaltyService = {
  async checkConsecutiveRejections(userId: string): Promise<boolean> {
    const recent = await prisma.eventProposal.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: CONSECUTIVE_THRESHOLD,
      select: { status: true },
    });

    if (recent.length < CONSECUTIVE_THRESHOLD) return false;

    const allRejected = recent.every((p) => p.status === 'REJECTED');
    if (!allRejected) return false;

    await prisma.campusPointTransaction.create({
      data: {
        userId,
        points: -PENALTY_POINTS,
        reason: `Penalty: ${CONSECUTIVE_THRESHOLD} consecutive rejected proposals`,
      },
    });
    return true;
  },
};
