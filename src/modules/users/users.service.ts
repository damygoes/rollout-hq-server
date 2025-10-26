import { prisma } from '../../db/prisma';
import { hashPassword } from '../auth/auth.service';

import type { Role } from '@prisma/client';

export function listUsers() {
  return prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
}

export async function createUserAdmin(email: string, password: string, role: Role) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

export function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
}
