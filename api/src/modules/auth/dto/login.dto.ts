import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  account: string; // email hoặc username

  @IsNotEmpty()
  password: string;
}
