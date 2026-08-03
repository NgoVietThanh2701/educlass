import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { sectionSelect, toSectionResponse } from './section.mapper';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, teacherId: string, dto: CreateSectionDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    const lastSection = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const section = await this.prisma.section.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? (lastSection?.order ?? 0) + 1,
      },
      select: sectionSelect,
    });

    return toSectionResponse(section);
  }

  async findAll(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: sectionSelect,
    });

    return sections.map(toSectionResponse);
  }

  async findAllForStudent(courseId: string, studentId: string) {
    await this.ensureStudentEnrolledInCourse(courseId, studentId);

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: sectionSelect,
    });

    return sections.map(toSectionResponse);
  }

  async findOne(courseId: string, sectionId: string, teacherId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: sectionSelect,
    });

    if (!section) throw AppException.notFound('Section not found');
    if (section.courseId !== courseId)
      throw AppException.badRequest('Section does not belong to this course');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    return toSectionResponse(section);
  }

  async findOneForStudent(courseId: string, sectionId: string, studentId: string) {
    await this.ensureStudentEnrolledInCourse(courseId, studentId);

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: sectionSelect,
    });

    if (!section) throw AppException.notFound('Section not found');
    if (section.courseId !== courseId) {
      throw AppException.badRequest('Section does not belong to this course');
    }

    return toSectionResponse(section);
  }

  async update(courseId: string, sectionId: string, teacherId: string, dto: UpdateSectionDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, courseId: true },
    });

    if (!section) throw AppException.notFound('Section not found');
    if (section.courseId !== courseId)
      throw AppException.badRequest('Section does not belong to this course');

    const updated = await this.prisma.section.update({
      where: { id: sectionId },
      data: dto,
      select: sectionSelect,
    });

    return toSectionResponse(updated);
  }

  private async ensureStudentEnrolledInCourse(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true, studentId: true },
    });

    if (!enrollment) throw AppException.forbidden('Student is not enrolled in this course');
  }
}
