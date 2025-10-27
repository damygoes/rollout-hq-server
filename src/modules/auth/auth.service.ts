import bcrypt from 'bcrypt';

import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

import type { Role } from '@prisma/client';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

/**
 * Hash a raw password using bcrypt.
 */
export async function hashPassword(raw: string) {
  return bcrypt.hash(raw, BCRYPT_ROUNDS);
}

/**
 * Verify a raw password against a bcrypt hash.
 */
export async function verifyPassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

/**
 * Domain lookup by email (internal).
 */
async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Authenticate user by email/password.
 * Throws AppError.unauth for invalid credentials (reveals which field failed).
 */
export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw AppError.unauth('Invalid email');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw AppError.unauth('Invalid password');

  return user;
}

/**
 * Register a new user. Throws AppError.conflict if the email is already taken.
 * You could also rely on Prisma P2002 (unique constraint) to map to CONFLICT in errorHandler,
 * but checking first gives a friendlier message.
 */
export async function registerUser(email: string, rawPassword: string, role: Role = 'VIEWER') {
  const exists = await findUserByEmail(email);
  if (exists) throw AppError.conflict('Email already in use');

  const passwordHash = await hashPassword(rawPassword);

  const created = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return created;
}
