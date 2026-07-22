import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttemptDto {
  @ApiProperty({ description: 'ID of the exam session to start' })
  @IsString()
  sessionId: string;
}
