import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'nvthanh.19it6@sict.udn.vn',
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
}

export class ResendOtpDto {
  @ApiProperty({
    example: 'nvthanh.19it6@sict.udn.vn',
  })
  @IsEmail()
  email: string;
}
