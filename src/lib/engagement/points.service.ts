import { prisma } from '@/lib/prisma';

export const POINTS = {
  PROPOSAL: 5,
  ACCEPTED: 20,
  COMPLETED: 30,
  VOLUNTEER: 10,
  MENTOR: 15,
  VOTES_PER_POINT: 10, // every 10 votes = 1 point
} as const;

async function award(userId: string, points: number, reason: string) {
  await prisma.campusPointTransaction.create({ data: { userId, points, reason } });
}

export const PointsService = {
  async awardProposalPoints(userId: string) {
    await award(userId, POINTS.PROPOSAL, 'Event proposal submitted');
  },
  async awardAcceptancePoints(userId: string) {
    await award(userId, POINTS.ACCEPTED, 'Event proposal accepted');
  },
  async awardCompletionPoints(userId: string) {
    await award(userId, POINTS.COMPLETED, 'Event completed');
  },
  async awardVolunteerPoints(userId: string) {
    await award(userId, POINTS.VOLUNTEER, 'Selected as volunteer');
  },
  async awardMentorPoints(userId: string) {
    await award(userId, POINTS.MENTOR, 'Faculty mentoring points');
  },
  async calculateVotePoints(userId: string, totalVotes: number) {
    const pointsEarned = Math.floor(totalVotes / POINTS.VOTES_PER_POINT);
    if (pointsEarned > 0) {
      await award(userId, pointsEarned, `Vote milestone: ${totalVotes} votes`);
    }
    return pointsEarned;
  },
  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await prisma.campusPointTransaction.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  },
  async getUserHistory(userId: string) {
    return prisma.campusPointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
