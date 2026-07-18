import { IsString, IsOptional, IsInt, Min, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExamSessionDto {
  @ApiProperty({ description: 'ID của đề thi (exam)' })
  @IsString()
  examId: string;

  @ApiProperty({ description: 'ID của lớp học' })
  @IsString()
  classId: string;

  @ApiProperty({ description: 'Tên buổi thi', example: 'Kiem tra giua ky' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Thời gian bắt đầu (ISO 8601)',
    example: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @ApiProperty({ default: 0, description: 'Phút gia hạn sau khi hết giờ làm bài' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sessionDelayMinutes?: number;
}
