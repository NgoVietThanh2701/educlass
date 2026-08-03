import { ApiProperty } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsString,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'nvthanh.19it6@sict.udn.vn',
    description: 'Email đăng ký',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(60)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
    message:
      'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;

  @ApiProperty({
    example: RoleUser.STUDENT,
    description: 'Vai trò tài khoản khi đăng ký',
    enum: RoleUser,
  })
  @IsNotEmpty()
  @IsEnum(RoleUser)
  role: RoleUser;
}
