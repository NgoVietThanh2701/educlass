import { Prisma } from '@prisma/client';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserSelect } from '../selects/user.select';

type UserResponsePayload = Prisma.UserGetPayload<{
  select: typeof UserSelect.response;
}>;

export class UserMapper {
  static toResponse(user: UserResponsePayload): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      fullName: user.fullName,
      balance: user.balance.toNumber(),
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
