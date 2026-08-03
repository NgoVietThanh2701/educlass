import { AppException } from '@common/exceptions/app.exception';
import { AttachmentService } from '@common/services/attachment.service';
import { Injectable } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { courseSelect, toCourseResponse } from './course.mapper';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(teacherId: string, dto: CreateCourseDto, file?: Express.Multer.File) {
    let thumbnailObjectKey: string | null | undefined;

    if (file) {
      const uploaded = await this.attachmentService.uploadImage(file, 'course-thumbnails');
      thumbnailObjectKey = uploaded.objectKey;
    }

    const course = await this.prisma.course.create({
      data: {
        teacherId,
        title: dto.title,
        slug: dto.slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        thumbnailObjectKey,
        level: dto.level,
        language: dto.language,
        price: dto.price ?? 0,
        status: dto.status ?? CourseStatus.DRAFT,
      },
      select: courseSelect,
    });

    return toCourseResponse(course);
  }

  async findAllByTeacher(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      select: courseSelect,
    });

    return courses.map(toCourseResponse);
  }

  async findAllByStudent(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        course: {
          select: courseSelect,
        },
      },
    });

    return enrollments.map((enrollment) => toCourseResponse(enrollment.course));
  }

  async findOne(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: courseSelect,
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    return toCourseResponse(course);
  }

  async findOneForStudent(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true },
    });

    if (!enrollment) throw AppException.forbidden('Student is not enrolled in this course');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: courseSelect,
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.status === CourseStatus.DRAFT) {
      throw AppException.forbidden('Course is not available for students yet');
    }

    return toCourseResponse(course);
  }

  async update(courseId: string, teacherId: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!existing) throw AppException.notFound('Course not found');
    if (existing.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...dto,
        price: dto.price ?? undefined,
      },
      select: courseSelect,
    });

    return toCourseResponse(updated);
  }
}
