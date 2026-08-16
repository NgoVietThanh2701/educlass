import {
  buildLessonUnlockContext,
  isLessonUnlocked,
  LessonUnlockInput,
} from '@common/utils/lesson-unlock.util';
import { buildCourseProgressPayload } from '@common/utils/course-progress.util';
import { AppException } from '@common/exceptions/app.exception';
import { CourseAccessService } from '@common/services/course-access.service';
import {
  assessmentTeacherTreeSelect,
  assessmentTreeSelect,
  toAssessmentTeacherTreeItem,
  toAssessmentTreeItem,
} from '@modules/assessments/mapper/assessment.mapper';
import {
  lessonListSelect,
  lessonSelect,
  toLessonListItem,
  toLessonResponse,
} from '@modules/lessons/lesson.mapper';
import { sectionSelect, toSectionResponse } from '@modules/sections/section.mapper';
import { AttachmentService } from '@common/services/attachment.service';
import { Injectable } from '@nestjs/common';
import { AssessmentStatus, CourseStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { generateSlug } from '@common/utils/generate-code.util';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  courseListSelect,
  coursePublicDetailSelect,
  coursePublicListSelect,
  courseSelect,
  courseStudentSelect,
  courseTeacherListSelect,
  toCourseListItem,
  toCoursePublicDetail,
  toCoursePublicListItem,
  toCourseResponse,
  toCourseTeacherListItem,
} from './course.mapper';
import { CourseTeacherDetailDto } from './dto/course-teacher-detail.dto';
import { CourseStudentDetailDto } from './dto/course-student-detail.dto';
import { CourseListItemDto } from './dto/course-list-item.dto';
import { CoursePublicListItemDto } from './dto/course-list-item.dto';
import { GetPublicCoursesQueryDto } from './dto/get-public-courses-query.dto';
import { CourseTeacherListItemDto } from './dto/course-list-item.dto';
import { CoursePublicDetailDto } from './dto/course-public-detail.dto';
import { CourseResponseDto } from './dto/course-response.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentService: AttachmentService,
    private readonly courseAccess: CourseAccessService,
  ) {}

  async create(
    teacherId: string,
    dto: CreateCourseDto,
    file?: Express.Multer.File,
  ): Promise<CourseResponseDto> {
    if (!file) {
      throw AppException.badRequest('Thumbnail is required');
    }

    const uploaded = await this.attachmentService.uploadImage(file, 'course-thumbnails');
    const thumbnailObjectKey = uploaded.objectKey;

    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const slug = this.buildSlug(dto.title, attempt);

      try {
        const course = await this.prisma.course.create({
          data: {
            teacherId,
            title: dto.title,
            slug,
            shortDescription: dto.shortDescription,
            description: dto.description,
            thumbnailObjectKey,
            level: dto.level,
            language: dto.language,
            price: dto.price ?? 0,
            estimatedDuration: dto.estimatedDuration,
            requirements: dto.requirements,
            learningOutcomes: dto.learningOutcomes,
          },
          select: courseSelect,
        });

        return toCourseResponse(course);
      } catch (error) {
        if (this.isUniqueConstraintError(error) && attempt < maxAttempts - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Unable to generate a unique slug for course "${dto.title}"`);
  }

  async findAllPublished(query: GetPublicCoursesQueryDto): Promise<{
    data: CoursePublicListItemDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = { status: CourseStatus.PUBLISHED };

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: coursePublicListSelect,
      }),
    ]);

    return {
      data: courses.map(toCoursePublicListItem),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOnePublishedBySlug(slug: string): Promise<CoursePublicDetailDto> {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.PUBLISHED },
      select: coursePublicDetailSelect,
    });

    if (!course) throw AppException.notFound('Course not found');

    return toCoursePublicDetail(course);
  }

  async findAllByTeacher(teacherId: string): Promise<CourseTeacherListItemDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      select: courseTeacherListSelect,
    });

    return courses.map(toCourseTeacherListItem);
  }

  async findTeacherDetail(courseId: string, teacherId: string): Promise<CourseTeacherDetailDto> {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        ...courseSelect,
        sections: {
          orderBy: { order: 'asc' },
          select: {
            ...sectionSelect,
            lessons: {
              orderBy: { order: 'asc' },
              select: lessonSelect,
            },
            assessments: {
              orderBy: { order: 'asc' },
              // Lightweight outline — no questions/options here (see
              // assessmentTeacherTreeSelect), keeps this endpoint fast.
              select: assessmentTeacherTreeSelect,
            },
          },
        },
      },
    });

    if (!course) throw AppException.notFound('Course not found');

    const { sections, ...courseData } = course;

    return {
      ...toCourseResponse(courseData),
      sections: sections.map((section) => ({
        ...toSectionResponse(section),
        lessons: section.lessons.map(toLessonResponse),
        assessments: section.assessments.map(toAssessmentTeacherTreeItem),
      })),
    };
  }

  async findAllByStudent(studentId: string): Promise<CourseListItemDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        course: {
          select: courseListSelect,
        },
      },
    });

    return enrollments.map((enrollment) => toCourseListItem(enrollment.course));
  }

  async findStudentDetail(courseId: string, studentId: string): Promise<CourseStudentDetailDto> {
    await this.courseAccess.ensureStudentEnrolled(courseId, studentId);
    await this.courseAccess.ensurePublishedCourse(courseId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        ...courseStudentSelect,
        sections: {
          orderBy: { order: 'asc' },
          select: {
            ...sectionSelect,
            order: true,
            lessons: {
              orderBy: { order: 'asc' },
              select: lessonListSelect,
            },
            assessments: {
              where: { status: AssessmentStatus.PUBLISHED },
              orderBy: { order: 'asc' },
              select: assessmentTreeSelect,
            },
          },
        },
      },
    });

    if (!course) throw AppException.notFound('Course not found');

    const lessonIds = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id),
    );

    const [lessonProgressRows, passedAttempts] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: { userId: studentId, lessonId: { in: lessonIds } },
        select: {
          lessonId: true,
          userId: true,
          completed: true,
          lastPosition: true,
          completedAt: true,
          createdAt: true,
        },
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

    const progressByLessonId = new Map(lessonProgressRows.map((row) => [row.lessonId, row]));
    const completedLessonIds = new Set(
      lessonProgressRows.filter((row) => row.completed).map((row) => row.lessonId),
    );
    const passedAssessmentIds = new Set(passedAttempts.map((row) => row.assessmentId));

    const unlockLessons: LessonUnlockInput[] = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        id: lesson.id,
        sectionId: section.id,
        order: lesson.order,
        unlockRule: lesson.unlockRule,
        sectionOrder: section.order,
      })),
    );

    const assessmentsForUnlock = course.sections.flatMap((section) =>
      section.assessments.map((assessment) => ({
        id: assessment.id,
        sectionOrder: section.order,
      })),
    );

    const unlockContext = buildLessonUnlockContext(
      unlockLessons,
      completedLessonIds,
      passedAssessmentIds,
      assessmentsForUnlock,
    );

    const totalLessons = lessonIds.length;
    const completedLessons = completedLessonIds.size;

    const { sections, ...courseData } = course;

    return {
      id: courseData.id,
      teacherId: courseData.teacherId,
      title: courseData.title,
      slug: courseData.slug,
      shortDescription: courseData.shortDescription,
      description: courseData.description,
      thumbnailUrl: toCourseListItem(courseData).thumbnailUrl,
      level: courseData.level,
      language: courseData.language,
      price: courseData.price.toNumber(),
      publishedAt: courseData.publishedAt,
      estimatedDuration: courseData.estimatedDuration,
      requirements: courseData.requirements,
      learningOutcomes: courseData.learningOutcomes,
      progress: buildCourseProgressPayload({
        courseId,
        studentId,
        totalLessons,
        completedLessons,
      }),
      sections: sections.map((section) => ({
        ...toSectionResponse(section),
        lessons: section.lessons.map((lesson) => {
          const unlockInput: LessonUnlockInput = {
            id: lesson.id,
            sectionId: section.id,
            order: lesson.order,
            unlockRule: lesson.unlockRule,
            sectionOrder: section.order,
          };

          const progress = progressByLessonId.get(lesson.id);

          return {
            ...toLessonListItem(lesson),
            isUnlocked: isLessonUnlocked(unlockInput, unlockContext),
            progress: progress ?? {
              lessonId: lesson.id,
              userId: studentId,
              completed: false,
              lastPosition: 0,
              completedAt: null,
              createdAt: new Date(),
            },
          };
        }),
        assessments: section.assessments.map(toAssessmentTreeItem),
      })),
      createdAt: courseData.createdAt,
      updatedAt: courseData.updatedAt,
    };
  }

  async findOne(courseId: string, teacherId: string): Promise<CourseResponseDto> {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: courseSelect,
    });

    if (!course) throw AppException.notFound('Course not found');

    return toCourseResponse(course);
  }

  async update(
    courseId: string,
    teacherId: string,
    dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

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

  async changeStatus(
    courseId: string,
    teacherId: string,
    status: CourseStatus,
  ): Promise<CourseResponseDto> {
    await this.courseAccess.ensureTeacherOwnsCourse(courseId, teacherId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, publishedAt: true },
    });

    if (!course) throw AppException.notFound('Course not found');

    const allowedTransitions: Record<CourseStatus, CourseStatus[]> = {
      [CourseStatus.DRAFT]: [CourseStatus.PUBLISHED, CourseStatus.ARCHIVED],
      [CourseStatus.PUBLISHED]: [CourseStatus.DRAFT, CourseStatus.ARCHIVED],
      [CourseStatus.ARCHIVED]: [CourseStatus.DRAFT],
    };

    if (!allowedTransitions[course.status].includes(status)) {
      throw AppException.badRequest(
        `Cannot transition course status from ${course.status} to ${status}`,
      );
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status,
        publishedAt:
          status === CourseStatus.PUBLISHED
            ? (course.publishedAt ?? new Date())
            : course.publishedAt,
        archivedAt: status === CourseStatus.ARCHIVED ? new Date() : null,
      },
      select: courseSelect,
    });

    return toCourseResponse(updated);
  }

  private buildSlug(title: string, attempt: number) {
    const baseSlug = generateSlug(title);
    return attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
  }

  private isUniqueConstraintError(error: unknown) {
    return (error as { code?: string }).code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION;
  }
}
