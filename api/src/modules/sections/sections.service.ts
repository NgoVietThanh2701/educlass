import { AppException } from '@common/exceptions/app.exception';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { AttachmentService } from '@common/services/attachment.service';
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
    private readonly attachmentService: AttachmentService,
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

  async reorder(courseId: string, orderedIds: string[], teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      select: { id: true },
    });
    const existingIds = new Set(sections.map((section) => section.id));

    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
      throw AppException.badRequest('Ordered section list does not match the course sections');
    }

    // Rewrites the orders to 1..n inside one transaction. Because `[courseId, order]`
    // is a UNIQUE constraint, updating straight to the final order could collide with
    // another section's current order mid-transaction (e.g. swapping two adjacent
    // orders). So we first move EVERY section to a unique temporary negative order,
    // then to its final 1..n order — no intermediate state ever violates the index.
    await this.prisma.$transaction([
      ...orderedIds.map((id, index) =>
        this.prisma.section.update({
          where: { id },
          data: { order: -(index + 1) },
          select: { id: true },
        }),
      ),
      ...orderedIds.map((id, index) =>
        this.prisma.section.update({
          where: { id },
          data: { order: index + 1 },
          select: { id: true },
        }),
      ),
    ]);

    return { orderedIds };
  }

  async remove(courseId: string, sectionId: string, teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.getSectionInCourse(courseId, sectionId);

    // Best-effort remove the Cloudinary assets of the section's lessons.
    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      select: {
        content: { select: { objectKey: true } },
        attachments: { select: { objectKey: true, resourceType: true } },
      },
    });

    const deletions = lessons.flatMap((lesson) => [
      ...(lesson.content?.objectKey
        ? [this.attachmentService.removeFile(lesson.content.objectKey, 'video')]
        : []),
      ...lesson.attachments.map((attachment) =>
        this.attachmentService.removeFile(attachment.objectKey, attachment.resourceType),
      ),
    ]);
    await Promise.allSettled(deletions);

    // Cascades to lessons, assessments, contents, attachments, progress.
    await this.prisma.section.delete({ where: { id: sectionId } });

    // Compact the remaining sections' orders (1..n) so there are no gaps.
    const remaining = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await this.prisma.$transaction(
      remaining.map((section, index) =>
        this.prisma.section.update({
          where: { id: section.id },
          data: { order: index + 1 },
          select: { id: true },
        }),
      ),
    );

    return { id: sectionId };
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
