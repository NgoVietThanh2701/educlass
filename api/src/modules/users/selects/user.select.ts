import { Prisma } from '@prisma/client';

export const UserSelect = {
  authUser: Prisma.validator<Prisma.UserSelect>()({
    id: true,
    email: true,
    userName: true,
    fullName: true,
    balance: true,
    role: true,
    createdAt: true,
  }),
};
