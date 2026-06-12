import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
  if (existing) {
    console.log('Admin user already exists');
    return;
  }
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@gmail.com',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('Admin user created: admin@gmail.com / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
