import { IsString, IsOptional, IsArray, ValidateNested, ValidateIf, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ description: 'Object key from Cloud' })
  @IsString()
  objectKey: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsInt()
  size: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({
    required: false,
    description: 'Resource type from storage (e.g., image, video, raw)',
  })
  @IsString()
  @IsOptional()
  resourceType?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiProperty({ required: false, description: 'Text content (optional if attachments present)' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.attachments || o.attachments.length === 0)
  content?: string;

  @ApiProperty({ required: false, type: [AttachmentDto], description: 'Attachments (optional)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}
