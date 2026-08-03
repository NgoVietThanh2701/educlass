import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttemptDto {
  @ApiProperty({ description: 'ID of the assessment to start' })
  @IsString()
  assessmentId: string;
}
