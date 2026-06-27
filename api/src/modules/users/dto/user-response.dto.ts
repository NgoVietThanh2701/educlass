import { ApiProperty } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  balance: number;

  @ApiProperty({ enum: RoleUser })
  role: RoleUser;

  @ApiProperty()
  createdAt: Date;
}
