import { AppException } from '@common/exceptions/app.exception';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { CourseAccessService } from '@common/services/course-access.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { sectionSelect, toSectionResponse } from './section.mapper';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, teacherId: string, dto: CreateSectionDto) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const lastSection = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = dto.order ?? (lastSection?.order ?? 0) + 1;
    await this.ensureOrderAvailable(courseId, order);

    try {
      const section = await this.prisma.section.create({
        data: {
          courseId,
          title: dto.title,
          description: dto.description,
          order,
        },
        select: sectionSelect,
      });

      return toSectionResponse(section);
    } catch (error) {
      this.handleOrderConflict(error, order);
    }
  }

  async findAll(courseId: string, teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: sectionSelect,
    });

    return sections.map(toSectionResponse);
  }

  async findOne(courseId: string, sectionId: string, teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    return this.getSectionInCourse(courseId, sectionId);
  }

  async update(courseId: string, sectionId: string, teacherId: string, dto: UpdateSectionDto) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.getSectionInCourse(courseId, sectionId);

    if (dto.order !== undefined) {
      await this.ensureOrderAvailable(courseId, dto.order, sectionId);
    }

    try {
      const updated = await this.prisma.section.update({
        where: { id: sectionId },
        data: dto,
        select: sectionSelect,
      });

      return toSectionResponse(updated);
    } catch (error) {
      if (dto.order !== undefined) {
        this.handleOrderConflict(error, dto.order);
      }

      throw error;
    }
  }

  private async ensureOrderAvailable(courseId: string, order: number, excludeSectionId?: string) {
    const existing = await this.prisma.section.findFirst({
      where: {
        courseId,
        order,
        ...(excludeSectionId ? { id: { not: excludeSectionId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw AppException.conflict(`Section order ${order} is already used in this course`);
    }
  }

  private handleOrderConflict(error: unknown, order: number): never {
    if ((error as { code?: string }).code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
      throw AppException.conflict(`Section order ${order} is already used in this course`);
    }

    throw error;
  }

  private async getSectionInCourse(courseId: string, sectionId: string) {
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
}
