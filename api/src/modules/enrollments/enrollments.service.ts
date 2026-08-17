import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { buildCourseProgressPayload } from '@common/utils/course-progress.util';
import { enrollmentSelect, toEnrollmentResponse } from './enrollment.mapper';
import { ConversationService } from '@modules/chat/services/conversation.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
  ) {}

  async enroll(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true, status: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.status !== CourseStatus.PUBLISHED) {
      throw AppException.badRequest('Course is not open for enrollment');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!student) throw AppException.notFound('Student not found');
    if (student.role !== 'STUDENT') throw AppException.forbidden('Only students can enroll');

    const existing = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true, studentId: true },
    });

    if (existing) throw AppException.conflict('Student is already enrolled in this course');

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        studentId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: enrollmentSelect,
    });

    // Keep the per-course group conversation in sync: if the teacher has
    // already opened the group, the new student is added as a participant so
    // they immediately see the conversation. If the group does not exist yet,
    // it will be seeded with this student when the teacher creates it.
    await this.conversationService.addUserToGroupChat(courseId, studentId);

    return toEnrollmentResponse(enrollment);
  }

  async findMyEnrollments(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      select: enrollmentSelect,
    });

    return enrollments.map(toEnrollmentResponse);
  }

  private async buildCourseProgress(
    studentId: string,
    courseId: string,
    sections: Array<{ lessons: Array<{ id: string }> }>,
  ) {
    const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId: studentId,
        lessonId: {
          in: sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)),
        },
        completed: true,
      },
    });

    return buildCourseProgressPayload({
      courseId,
      studentId,
      totalLessons,
      completedLessons,
    });
  }

  async getMyCourseProgress(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: {
        courseId: true,
        course: {
          select: {
            sections: {
              select: {
                lessons: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    return Promise.all(
      enrollments.map(async (enrollment) =>
        this.buildCourseProgress(studentId, enrollment.courseId, enrollment.course.sections),
      ),
    );
  }

  async getCourseProgress(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: {
        courseId: true,
        course: { select: { sections: { select: { lessons: { select: { id: true } } } } } },
      },
    });

    if (!enrollment) throw AppException.forbidden('Student is not enrolled in this course');

    return this.buildCourseProgress(studentId, courseId, enrollment.course.sections);
  }

  async updateStatus(
    courseId: string,
    studentId: string,
    teacherId: string,
    status: EnrollmentStatus,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: enrollmentSelect,
    });

    if (!enrollment) throw AppException.notFound('Enrollment not found');

    const updated = await this.prisma.enrollment.update({
      where: { courseId_studentId: { courseId, studentId } },
      data: {
        status,
        completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
      select: enrollmentSelect,
    });

    return toEnrollmentResponse(updated);
  }
}
