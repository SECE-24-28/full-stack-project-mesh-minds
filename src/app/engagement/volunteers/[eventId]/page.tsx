import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { VolunteerManagementTable } from '@/components/engagement/VolunteerManagementTable';

export default async function VolunteerManagementPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!['FACULTY', 'ADMIN'].includes(session.user.role)) redirect('/dashboard');

  const { eventId } = await params;
  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
    select: { id: true, title: true },
  });
  if (!event) notFound();

  const applications = await prisma.volunteerApplication.findMany({
    where: { eventId },
    include: { student: { select: { name: true, department: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = applications.map((a) => ({
    id: a.id,
    studentName: a.student.name,
    skill: a.skill,
    reason: a.reason,
    status: a.status,
    department: a.student.department ?? undefined,
  }));

  return (
    <div className="animate-fade-in p-8">
      <Link href="/proposals" className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Volunteer Applications</h1>
        <p className="mt-1 text-sm text-slate-500">{event.title}</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-white">Applications ({formatted.length})</span>
        </div>
        <VolunteerManagementTable applications={formatted} />
      </div>
    </div>
  );
}
