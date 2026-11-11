import type { Role } from '@prisma/client';

/** User fields that may be returned to the client. Never includes passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
