import { AppException } from '@common/exceptions/app.exception';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { CourseAccessService } from '@common/services/course-access.service';
import {
  buildLessonUnlockContext,
  isLessonUnlocked,
  LessonUnlockInput,
} from '@common/utils/lesson-unlock.util';
import { AttachmentService } from '@common/services/attachment.service';
import { Injectable } from '@nestjs/common';
import { AssessmentStatus, LessonType, LessonUnlockRule } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonContentDto } from './dto/lesson-content.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import {
  lessonAttachmentSelect,
  lessonSelect,
  toLessonAttachmentResponse,
  toLessonResponse,
} from './lesson.mapper';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentService: AttachmentService,
    private readonly courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, sectionId: string, teacherId: string, dto: CreateLessonDto) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lastLesson = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = dto.order ?? (lastLesson?.order ?? 0) + 1;
    await this.ensureOrderAvailable(sectionId, order);

    try {
      const lesson = await this.prisma.lesson.create({
        data: {
          sectionId,
          title: dto.title,
          description: dto.description,
          type: dto.type ?? LessonType.TEXT,
          order,
          durationSeconds: dto.durationSeconds,
          isPreview: dto.isPreview ?? false,
          unlockRule: dto.unlockRule ?? LessonUnlockRule.FREE,
        },
        select: lessonSelect,
      });

      return toLessonResponse(lesson);
    } catch (error) {
      this.handleOrderConflict(error, order);
    }
  }

  async findAll(courseId: string, sectionId: string, teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
      select: lessonSelect,
    });

    return lessons.map(toLessonResponse);
  }

  async findOne(courseId: string, sectionId: string, lessonId: string, teacherId: string) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: lessonSelect,
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    if (lesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }

    return toLessonResponse(lesson);
  }

  async findOneForStudent(
    courseId: string,
    sectionId: string,
    lessonId: string,
    studentId: string,
  ) {
    await this.courseAccess.ensureStudentEnrolled(courseId, studentId);
    await this.courseAccess.ensurePublishedCourse(courseId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);
    await this.ensureLessonUnlocked(courseId, sectionId, lessonId, studentId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: lessonSelect,
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    return toLessonResponse(lesson);
  }

  async update(
    courseId: string,
    sectionId: string,
    lessonId: string,
    teacherId: string,
    dto: UpdateLessonDto,
  ) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, sectionId: true },
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    if (lesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }

    if (dto.order !== undefined) {
      await this.ensureOrderAvailable(sectionId, dto.order, lessonId);
    }

    try {
      const updated = await this.prisma.lesson.update({
        where: { id: lessonId },
        data: dto,
        select: lessonSelect,
      });

      return toLessonResponse(updated);
    } catch (error) {
      if (dto.order !== undefined) {
        this.handleOrderConflict(error, dto.order);
      }

      throw error;
    }
  }

  async upsertContent(
    courseId: string,
    sectionId: string,
    lessonId: string,
    teacherId: string,
    dto: LessonContentDto,
  ) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);

    return this.prisma.lessonContent.upsert({
      where: { lessonId },
      create: {
        lessonId,
        objectKey: dto.objectKey,
        videoDuration: dto.videoDuration,
        textContent: dto.textContent,
      },
      update: {
        objectKey: dto.objectKey,
        videoDuration: dto.videoDuration,
        textContent: dto.textContent,
      },
    });
  }

  async uploadAttachment(
    courseId: string,
    sectionId: string,
    lessonId: string,
    teacherId: string,
    file: Express.Multer.File,
  ) {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);

    const uploaded = await this.attachmentService.uploadFile(file, 'lesson-attachments');

    const attachment = await this.prisma.lessonAttachment.create({
      data: {
        lessonId,
        fileName: file.originalname,
        objectKey: uploaded.objectKey,
        resourceType: uploaded.resourceType ?? 'auto',
        size: file.size,
        mimeType: file.mimetype,
      },
      select: lessonAttachmentSelect,
    });

    return toLessonAttachmentResponse(attachment);
  }

  async getProgress(courseId: string, sectionId: string, lessonId: string, studentId: string) {
    await this.courseAccess.ensureStudentEnrolled(courseId, studentId);
    await this.courseAccess.ensurePublishedCourse(courseId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: studentId, lessonId } },
    });

    if (!progress) {
      return {
        lessonId,
        userId: studentId,
        completed: false,
        lastPosition: 0,
        completedAt: null,
        createdAt: new Date(),
      };
    }

    return progress;
  }

  async upsertProgress(
    courseId: string,
    sectionId: string,
    lessonId: string,
    studentId: string,
    dto: UpdateLessonProgressDto,
  ) {
    await this.courseAccess.ensureStudentEnrolled(courseId, studentId);
    await this.courseAccess.ensurePublishedCourse(courseId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);
    await this.ensureLessonUnlocked(courseId, sectionId, lessonId, studentId);

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: studentId, lessonId } },
      select: { id: true, completed: true, lastPosition: true, completedAt: true },
    });

    const completed = dto.completed ?? existing?.completed ?? false;
    const lastPosition = dto.lastPosition ?? existing?.lastPosition ?? 0;

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: studentId, lessonId } },
      create: {
        userId: studentId,
        lessonId,
        completed,
        lastPosition,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        lastPosition,
        completedAt: completed ? (existing?.completedAt ?? new Date()) : null,
      },
    });
  }

  private async ensureOrderAvailable(sectionId: string, order: number, excludeLessonId?: string) {
    const existing = await this.prisma.lesson.findFirst({
      where: {
        sectionId,
        order,
        ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw AppException.conflict(`Lesson order ${order} is already used in this section`);
    }
  }

  private handleOrderConflict(error: unknown, order: number): never {
    if ((error as { code?: string }).code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
      throw AppException.conflict(`Lesson order ${order} is already used in this section`);
    }

    throw error;
  }

  private async ensureSectionBelongsToCourse(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, courseId: true },
    });

    if (!section) throw AppException.notFound('Section not found');
    if (section.courseId !== courseId) {
      throw AppException.badRequest('Section does not belong to this course');
    }
  }

  private async ensureLessonBelongsToSection(sectionId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, sectionId: true },
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    if (lesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }
  }

  private async ensureLessonUnlocked(
    courseId: string,
    sectionId: string,
    lessonId: string,
    studentId: string,
  ) {
    const sections = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        order: true,
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, sectionId: true, order: true, unlockRule: true },
        },
        assessments: {
          where: { status: AssessmentStatus.PUBLISHED },
          select: { id: true },
        },
      },
    });

    const targetLesson = sections
      .flatMap((section) => section.lessons)
      .find((lesson) => lesson.id === lessonId);

    if (!targetLesson) throw AppException.notFound('Lesson not found');
    if (targetLesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }

    const targetSection = sections.find((section) => section.id === sectionId);
    if (!targetSection) throw AppException.notFound('Section not found');

    const unlockLessons: LessonUnlockInput[] = sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        id: lesson.id,
        sectionId: section.id,
        order: lesson.order,
        unlockRule: lesson.unlockRule,
        sectionOrder: section.order,
      })),
    );

    const assessmentsForUnlock = sections.flatMap((section) =>
      section.assessments.map((assessment) => ({
        id: assessment.id,
        sectionOrder: section.order,
      })),
    );

    const [completedProgress, passedAttempts] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: {
          userId: studentId,
          completed: true,
          lesson: { section: { courseId } },
        },
        select: { lessonId: true },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: {
          studentId,
          passed: true,
          assessment: { section: { courseId } },
        },
        select: { assessmentId: true },
      }),
    ]);

    const unlockContext = buildLessonUnlockContext(
      unlockLessons,
      new Set(completedProgress.map((row) => row.lessonId)),
      new Set(passedAttempts.map((row) => row.assessmentId)),
      assessmentsForUnlock,
    );

    const unlockInput: LessonUnlockInput = {
      id: targetLesson.id,
      sectionId: targetSection.id,
      order: targetLesson.order,
      unlockRule: targetLesson.unlockRule,
      sectionOrder: targetSection.order,
    };

    if (!isLessonUnlocked(unlockInput, unlockContext)) {
      throw AppException.forbidden('This lesson is locked until the prerequisite is completed');
    }
  }
}
