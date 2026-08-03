import { Prisma } from '@prisma/client';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';

export const enrollmentSelect = Prisma.validator<Prisma.EnrollmentSelect>()({
  courseId: true,
  studentId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  joinedAt: true,
});

export type EnrollmentMapperInput = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

export function toEnrollmentResponse(enrollment: EnrollmentMapperInput): EnrollmentResponseDto {
  return {
    courseId: enrollment.courseId,
    studentId: enrollment.studentId,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    joinedAt: enrollment.joinedAt,
  };
}
