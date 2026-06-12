import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['STUDENT', 'FACULTY']),
  department: z.string().optional(),
  rollNumber: z.string().optional(),
  year: z.number().int().min(1).max(4).optional(),
  section: z.string().optional(),
  employeeId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    if (parsed.role === 'STUDENT') {
      if (!parsed.rollNumber || !parsed.department || !parsed.year || !parsed.section) {
        return NextResponse.json({ message: 'Roll Number, Department, Year, and Section are required for students' }, { status: 400 });
      }
      const existingRoll = await prisma.user.findUnique({ where: { rollNumber: parsed.rollNumber } });
      if (existingRoll) {
        return NextResponse.json({ message: 'Roll Number already registered' }, { status: 409 });
      }
    }

    if (parsed.role === 'FACULTY') {
      if (!parsed.employeeId || !parsed.department) {
        return NextResponse.json({ message: 'Employee ID and Department are required for faculty' }, { status: 400 });
      }
      const existingEmp = await prisma.user.findUnique({ where: { employeeId: parsed.employeeId } });
      if (existingEmp) {
        return NextResponse.json({ message: 'Employee ID already registered' }, { status: 409 });
      }
    }

    const passwordHash = await hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: parsed.role,
        emailVerified: true,
        department: parsed.department,
        rollNumber: parsed.rollNumber,
        year: parsed.year,
        section: parsed.section,
        employeeId: parsed.employeeId,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ message: 'Registered successfully', user });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
}
