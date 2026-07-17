import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email hoặc Username',
    example: 'nvthanh.19it6@sict.udn.vn',
    examples: {
      email: {
        summary: 'Đăng nhập bằng email',
        value: 'nvthanh.19it6@sict.udn.vn',
      },
      username: {
        summary: 'Đăng nhập bằng username',
        value: 'john_doe',
      },
    },
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'Password@123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
