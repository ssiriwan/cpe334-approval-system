import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const prisma = new PrismaClient();

/**
 * Demo account password.
 *
 * Local development and CI may fall back to the well-known demo password, but a
 * production deployment (Cloud Run) must supply `DEMO_USER_PASSWORD` from Secret
 * Manager - see deploy/deploy.sh. This repository is public, so a real password
 * must never be hard-coded here.
 *
 * `ADMIN_PASSWORD` is intentionally unused: Sprint 1 has no ADMIN account, and
 * the role is deferred to Sprint 3.
 */
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'Password123!';

/**
 * `SEED_DEMO_DATA=false` (the deploy/deploy.sh default without `--demo`) skips
 * seeding so a deployment never publishes demo credentials unless asked to.
 */
const seedRequested = process.env.SEED_DEMO_DATA !== 'false';

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
  if (!seedRequested) {
    console.log('SEED_DEMO_DATA=false: skipping demo accounts.');
    return;
  }

  if (process.env.NODE_ENV === 'production' && !process.env.DEMO_USER_PASSWORD) {
    throw new Error(
      'DEMO_USER_PASSWORD must be provided by Secret Manager in production (never the demo default).',
    );
  }

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
