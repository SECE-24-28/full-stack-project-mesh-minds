import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { bookingDate: 'desc' },
    include: {
      ticket: { select: { name: true, price: true } },
      proposal: { select: { title: true, startDate: true, venue: true } },
    },
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      ticketId: b.ticketId,
      proposalId: b.proposalId,
      userId: b.userId,
      status: b.status,
      ticketCode: b.ticketCode,
      bookingDate: b.bookingDate.toISOString(),
      ticketName: b.ticket.name,
      ticketPrice: b.ticket.price,
      eventTitle: b.proposal.title,
      eventDate: b.proposal.startDate.toISOString(),
      eventVenue: b.proposal.venue,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { proposalId, ticketId } = await request.json();
  if (!proposalId || !ticketId) {
    return NextResponse.json({ message: 'proposalId and ticketId are required' }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
  }

  const bookedCount = await prisma.booking.count({
    where: { ticketId, status: 'CONFIRMED' },
  });

  if (bookedCount >= ticket.capacity) {
    return NextResponse.json({ message: 'Ticket is sold out' }, { status: 409 });
  }

  const ticketCode = `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const booking = await prisma.booking.create({
    data: { ticketId, proposalId, userId: session.user.id, ticketCode },
  });

  return NextResponse.json({
    booking: { ...booking, bookingDate: booking.bookingDate.toISOString() },
  });
}
