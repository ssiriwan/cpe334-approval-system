import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(repoRoot, '.env') });

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= randomBytes(32).toString('hex');
process.env.DATABASE_URL ??=
  'postgresql://approval_user:approval_pass@localhost:5434/approval_db?schema=public';
