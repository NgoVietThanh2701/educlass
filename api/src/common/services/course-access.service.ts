import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class CourseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTeacherOwnsCourse(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    return course;
  }

  async ensureStudentEnrolled(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true },
    });

    if (!enrollment) throw AppException.forbidden('Student is not enrolled in this course');
  }

  async ensurePublishedCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.status !== CourseStatus.PUBLISHED) {
      throw AppException.forbidden('Course is not available for students yet');
    }
  }
}
