import { AppException } from '@common/exceptions/app.exception';
import { AttachmentService } from '@common/services/attachment.service';
import { Injectable } from '@nestjs/common';
import { LessonType, LessonUnlockRule } from '@prisma/client';
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
  ) {}

  async create(courseId: string, sectionId: string, teacherId: string, dto: CreateLessonDto) {
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lastLesson = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? LessonType.TEXT,
        order: dto.order ?? (lastLesson?.order ?? 0) + 1,
        durationSeconds: dto.durationSeconds,
        isPreview: dto.isPreview ?? false,
        unlockRule: dto.unlockRule ?? LessonUnlockRule.FREE,
      },
      select: lessonSelect,
    });

    return toLessonResponse(lesson);
  }

  async findAll(courseId: string, sectionId: string, teacherId: string) {
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
      select: lessonSelect,
    });

    return lessons.map(toLessonResponse);
  }

  async findAllForStudent(courseId: string, sectionId: string, studentId: string) {
    await this.ensureStudentEnrolledInCourse(courseId, studentId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
      select: lessonSelect,
    });

    return lessons.map((lesson) => toLessonResponse(lesson));
  }

  async findOne(courseId: string, sectionId: string, lessonId: string, teacherId: string) {
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
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
    await this.ensureStudentEnrolledInCourse(courseId, studentId);
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
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, sectionId: true },
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    if (lesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto,
      select: lessonSelect,
    });

    return toLessonResponse(updated);
  }

  async upsertContent(
    courseId: string,
    sectionId: string,
    lessonId: string,
    teacherId: string,
    dto: LessonContentDto,
  ) {
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);

    const content = await this.prisma.lessonContent.upsert({
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

    return content;
  }

  async uploadAttachment(
    courseId: string,
    sectionId: string,
    lessonId: string,
    teacherId: string,
    file: Express.Multer.File,
  ) {
    await this.ensureTeacherOwnsCourse(courseId, teacherId);
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
    await this.ensureStudentEnrolledInCourse(courseId, studentId);
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
    await this.ensureStudentEnrolledInCourse(courseId, studentId);
    await this.ensureSectionBelongsToCourse(courseId, sectionId);
    await this.ensureLessonBelongsToSection(sectionId, lessonId);
    await this.ensureLessonUnlocked(courseId, sectionId, lessonId, studentId);

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: studentId, lessonId } },
      select: { id: true, completed: true, lastPosition: true, completedAt: true },
    });

    const completed = dto.completed ?? existing?.completed ?? false;
    const lastPosition = dto.lastPosition ?? existing?.lastPosition ?? 0;

    const progress = await this.prisma.lessonProgress.upsert({
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

    return progress;
  }

  private async ensureTeacherOwnsCourse(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) throw AppException.notFound('Course not found');
    if (course.teacherId !== teacherId) throw AppException.forbidden('Not authorized');
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

  private async ensureStudentEnrolledInCourse(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true, studentId: true },
    });

    if (!enrollment) throw AppException.forbidden('Student is not enrolled in this course');
  }

  private async ensureLessonUnlocked(
    courseId: string,
    sectionId: string,
    lessonId: string,
    studentId: string,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        sectionId: true,
        order: true,
        unlockRule: true,
        section: {
          select: {
            courseId: true,
            order: true,
          },
        },
      },
    });

    if (!lesson) throw AppException.notFound('Lesson not found');
    if (lesson.sectionId !== sectionId) {
      throw AppException.badRequest('Lesson does not belong to this section');
    }

    if (lesson.unlockRule === LessonUnlockRule.FREE) {
      return;
    }

    let previousLessonCompleted = true;

    if (lesson.unlockRule === LessonUnlockRule.PREVIOUS_LESSON) {
      const previousLesson = await this.prisma.lesson.findFirst({
        where: {
          sectionId,
          order: lesson.order - 1,
        },
        select: { id: true },
      });

      if (previousLesson) {
        const progress = await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: studentId, lessonId: previousLesson.id } },
          select: { completed: true },
        });
        previousLessonCompleted = progress?.completed ?? false;
      }
    }

    if (lesson.unlockRule === LessonUnlockRule.PREVIOUS_ASSESSMENT) {
      const previousAssessment = await this.prisma.assessment.findFirst({
        where: {
          section: {
            courseId: lesson.section.courseId,
            order: {
              lt: lesson.section.order,
            },
          },
        },
        orderBy: [{ section: { order: 'desc' } }, { order: 'desc' }],
        select: { id: true },
      });

      if (previousAssessment) {
        const attempt = await this.prisma.assessmentAttempt.findFirst({
          where: {
            assessmentId: previousAssessment.id,
            studentId,
            passed: true,
          },
          orderBy: { startedAt: 'desc' },
          select: { id: true },
        });

        previousLessonCompleted = !!attempt;
      }
    }

    if (!previousLessonCompleted) {
      throw AppException.forbidden('This lesson is locked until the prerequisite is completed');
    }
  }
}
