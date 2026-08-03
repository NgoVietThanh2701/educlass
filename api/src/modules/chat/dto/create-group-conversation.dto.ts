import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupConversationDto {
  @ApiProperty({ description: 'Course ID' })
  @IsString()
  courseId: string;
}
