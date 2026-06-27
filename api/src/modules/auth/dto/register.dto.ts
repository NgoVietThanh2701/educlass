import { IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
