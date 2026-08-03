import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';

export class EnrollmentResponseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiProperty()
  enrolledAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty()
  joinedAt: Date;
}
