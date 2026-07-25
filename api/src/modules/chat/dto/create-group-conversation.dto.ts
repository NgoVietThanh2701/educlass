import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupConversationDto {
  @ApiProperty({ description: 'Class ID' })
  @IsString()
  classId: string;
}
