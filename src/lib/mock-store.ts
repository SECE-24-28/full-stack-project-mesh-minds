import { hash } from 'bcryptjs';
import { BookingRecord, CommentRecord, FundingContributionRecord, Proposal, Role, UserRecord } from '@/types';

const users: UserRecord[] = [
  {
    id: 'u-admin',
    name: 'Ava Chen',
    email: 'admin@campusconnect.edu',
    role: 'ADMIN',
    passwordHash: '',
    emailVerified: true,
    verificationToken: null,
  },
  {
    id: 'u-faculty',
    name: 'Dr. Malik',
    email: 'faculty@campusconnect.edu',
    role: 'FACULTY',
    passwordHash: '',
    emailVerified: true,
    verificationToken: null,
  },
  {
    id: 'u-student',
    name: 'Jordan Lee',
    email: 'student@campusconnect.edu',
    role: 'STUDENT',
    passwordHash: '',
    emailVerified: true,
    verificationToken: null,
  },
];

const proposals: Proposal[] = [
  {
    id: 'p-1',
    title: 'AI for Social Good Hackathon',
    description: 'A weekend hackathon focused on campus impact projects.',
    category: 'Hackathon',
    expectedAudience: 120,
    budget: 5000,
    startDate: '2026-09-16',
    endDate: '2026-09-17',
    venue: 'Innovation Lab',
    attachments: ['agenda.pdf'],
    status: 'ACCEPTED',
    authorId: 'u-student',
    authorName: 'Jordan Lee',
    createdAt: '2026-06-01',
    voteCount: 12,
  },
  {
    id: 'p-2',
    title: 'Cultural Night Showcase',
    description: 'Student-led showcase with music, dance, and food.',
    category: 'Cultural',
    expectedAudience: 300,
    budget: 3000,
    startDate: '2026-10-02',
    endDate: '2026-10-02',
    venue: 'Main Auditorium',
    attachments: [],
    status: 'PENDING_FACULTY_APPROVAL',
    authorId: 'u-student',
    authorName: 'Jordan Lee',
    createdAt: '2026-06-04',
    voteCount: 7,
  },
];

const comments: CommentRecord[] = [
  {
    id: 'c-1',
    content: 'Love the initiative and the community impact.',
    proposalId: 'p-1',
    userId: 'u-faculty',
    authorName: 'Dr. Malik',
    authorRole: 'FACULTY',
    createdAt: '2026-06-03T10:00:00.000Z',
  },
];

const fundingContributions: FundingContributionRecord[] = [
  {
    id: 'f-1',
    amount: 1500,
    proposalId: 'p-1',
    contributor: 'Campus Alumni Circle',
    date: '2026-06-05',
  },
];

const bookings: BookingRecord[] = [];

export async function seedUsers() {
  if (users.every((user) => user.passwordHash)) {
    return users;
  }

  const passwordHash = await hash('Password123!', 10);
  users.forEach((user) => {
    user.passwordHash = passwordHash;
  });

  return users;
}

export async function findUserByEmail(email: string) {
  await seedUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function createUser({ name, email, password, role, department, employeeId }: { name: string; email: string; password: string; role: Role; department?: string; employeeId?: string }) {
  await seedUsers();
  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return null;
  }

  const passwordHash = await hash(password, 10);
  const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const user: UserRecord = {
    id: `u-${users.length + 1}`,
    name,
    email,
    role,
    passwordHash,
    department,
    employeeId,
    emailVerified: false,
    verificationToken,
  };
  users.push(user);
  return user;
}

export async function verifyUser(token: string) {
  const user = users.find((u) => u.verificationToken === token);
  if (!user) {
    return null;
  }
  user.emailVerified = true;
  user.verificationToken = null;
  return user;
}

export function getAllProposals() {
  return proposals;
}

export function getProposalById(id: string) {
  return proposals.find((proposal) => proposal.id === id);
}

export function createProposal(input: Omit<Proposal, 'id' | 'createdAt' | 'voteCount' | 'authorName'> & { authorName: string }) {
  const newProposal: Proposal = {
    ...input,
    id: `p-${proposals.length + 1}`,
    createdAt: new Date().toISOString(),
    voteCount: 0,
  };
  proposals.unshift(newProposal);
  return newProposal;
}

export function createComment(input: Omit<CommentRecord, 'id' | 'createdAt'>) {
  const comment: CommentRecord = {
    ...input,
    id: `c-${comments.length + 1}`,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  return comment;
}

export function getCommentsForProposal(proposalId: string) {
  return comments.filter((comment) => comment.proposalId === proposalId);
}

export function createFundingContribution(input: Omit<FundingContributionRecord, 'id'>) {
  const contribution: FundingContributionRecord = {
    ...input,
    id: `f-${fundingContributions.length + 1}`,
  };
  fundingContributions.push(contribution);
  return contribution;
}

export function getFundingContributions(proposalId: string) {
  return fundingContributions.filter((entry) => entry.proposalId === proposalId);
}

export function createBooking(input: Omit<BookingRecord, 'id'>) {
  const booking: BookingRecord = {
    ...input,
    id: `b-${bookings.length + 1}`,
  };
  bookings.push(booking);
  return booking;
}

export function getBookingsForUser(userId: string) {
  return bookings.filter((booking) => booking.userId === userId);
}
