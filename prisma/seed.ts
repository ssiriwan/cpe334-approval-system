import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

const accounts = [
  {
    email: 'oum.requester@cpe334.local',
    name: 'Oum Requester',
    role: Role.REQUESTER,
  },
  {
    email: 't.reviewer@cpe334.local',
    name: 'T Reviewer',
    role: Role.REVIEWER,
  },
  {
    email: 'manager.hybrid@cpe334.local',
    name: 'Manager Hybrid',
    role: Role.REVIEWER,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        passwordHash,
      },
      create: {
        ...account,
        passwordHash,
      },
    });
  }

  console.log(`Seeded ${accounts.length} demo accounts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
