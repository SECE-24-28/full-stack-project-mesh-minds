export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type EventStatus = 'PENDING_FACULTY_APPROVAL' | 'PENDING_ADMIN_APPROVAL' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export type CalendarRoleType = 'PARTICIPANT' | 'PROPOSER' | 'VOLUNTEER' | 'MENTOR';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  department?: string;
  employeeId?: string;
  rollNumber?: string;
  year?: number;
  section?: string;
  profileImage?: string | null;
  points?: number;
  createdEventsCount?: number;
  registeredEventsCount?: number;
  mentoredEventsCount?: number;
  emailVerified?: boolean;
  verificationToken?: string | null;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  expectedAudience: number;
  budget: number;
  startDate: string;
  endDate: string;
  venue: string;
  coverImage?: string;
  attachments: string[];
  status: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  voteCount: number;
  mentorFacultyId?: string;
  participantLimit?: number;
  requiredVolunteers?: number;
  approvedById?: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  completedAt?: string | null;
  adminRating?: number | null;
  mentorRating?: number | null;
  eventRating?: number | null;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: string;
  userName?: string;
  userRollNumber?: string;
  userDepartment?: string;
}

export interface EPass {
  id: string;
  eventId: string;
  studentId: string;
  passCode: string;
  qrCodeUrl: string;
  createdAt: string;
  event?: {
    title: string;
    venue: string;
    startDate: string;
    endDate: string;
  };
  student?: {
    name: string;
    department: string;
    rollNumber: string;
  };
}

export interface CalendarEvent {
  id: string;
  userId: string;
  eventId: string;
  roleType: CalendarRoleType;
  title?: string;
  start?: string;
  end?: string;
}

export interface CommentRecord {
  id: string;
  content: string;
  proposalId: string;
  userId: string;
  authorName: string;
  authorRole: Role;
  createdAt: string;
  parentId?: string;
}

export interface FundingContributionRecord {
  id: string;
  amount: number;
  proposalId: string;
  contributor: string;
  date: string;
}

export interface BookingRecord {
  id: string;
  ticketId: string;
  proposalId: string;
  userId: string;
  userEmail: string;
  status: string;
  bookingDate: string;
  ticketCode: string;
}
