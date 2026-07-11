import { Prisma } from '@prisma/client';
import { UserResponseDto } from './dto/user-response.dto';

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  userName: true,
  fullName: true,
  mustChangePassword: true,
  role: true,
  balance: true,
  createdAt: true,
});

export type UserWithRelations = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

export function toUserResponse(user: UserWithRelations): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    fullName: user.fullName,
    balance: user.balance.toNumber(),
    mustChangePassword: user.mustChangePassword,
    role: user.role,
    createdAt: user.createdAt,
  };
}
