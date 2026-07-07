import { Prisma } from '@prisma/client';

export const UserSelect = {
  response: Prisma.validator<Prisma.UserSelect>()({
    id: true,
    email: true,
    userName: true,
    fullName: true,
    mustChangePassword: true,
    role: true,
    balance: true,
    createdAt: true,
  }),
  full: Prisma.validator<Prisma.UserSelect>()({
    id: true,
    email: true,
    userName: true,
    fullName: true,
    role: true,
    emailVerified: true,
    mustChangePassword: true,
    passwordHash: true,
    refreshToken: true,
    balance: true,
    createdAt: true,
  }),
};
