import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    example: 'Ngô Viết Thành',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class CreateStudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  userName: string;

  @ApiProperty({
    description: 'Temporary password. Only returned once.',
  })
  defaultPassword: string;
}
