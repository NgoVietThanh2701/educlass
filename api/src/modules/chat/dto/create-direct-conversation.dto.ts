import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectConversationDto {
  @ApiProperty({ description: 'Target user ID to chat with' })
  @IsString()
  targetUserId: string;
}
