import { ApiProperty } from '@nestjs/swagger';
import { PurposeOTP } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email cần xác thực',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP gồm 6 ký tự',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    enum: PurposeOTP,
    example: PurposeOTP.REGISTER,
    description: 'Mục đích sử dụng OTP',
  })
  @IsEnum(PurposeOTP)
  purpose: PurposeOTP;
}
