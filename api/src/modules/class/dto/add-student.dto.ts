import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddStudentDto {
  @ApiProperty({ description: 'ID student', example: 'stu260001' })
  @IsString()
  @IsNotEmpty()
  userName: string;
}
