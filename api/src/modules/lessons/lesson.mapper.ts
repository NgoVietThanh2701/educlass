import { Prisma } from '@prisma/client';
import { LessonAttachmentResponseDto } from './dto/lesson-attachment-response.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';

export const lessonAttachmentSelect = Prisma.validator<Prisma.LessonAttachmentSelect>()({
  id: true,
  lessonId: true,
  fileName: true,
  objectKey: true,
  resourceType: true,
  size: true,
  mimeType: true,
  createdAt: true,
});

export const lessonSelect = Prisma.validator<Prisma.LessonSelect>()({
  id: true,
  sectionId: true,
  title: true,
  description: true,
  type: true,
  order: true,
  durationSeconds: true,
  isPreview: true,
  unlockRule: true,
  createdAt: true,
  updatedAt: true,
  content: {
    select: {
      lessonId: true,
      objectKey: true,
      videoDuration: true,
      textContent: true,
    },
  },
  attachments: {
    select: lessonAttachmentSelect,
  },
});

export type LessonMapperInput = Prisma.LessonGetPayload<{
  select: typeof lessonSelect;
}>;

export type LessonAttachmentMapperInput = Prisma.LessonAttachmentGetPayload<{
  select: typeof lessonAttachmentSelect;
}>;

export function toLessonResponse(lesson: LessonMapperInput): LessonResponseDto {
  return {
    id: lesson.id,
    sectionId: lesson.sectionId,
    title: lesson.title,
    description: lesson.description,
    type: lesson.type,
    order: lesson.order,
    durationSeconds: lesson.durationSeconds,
    isPreview: lesson.isPreview,
    unlockRule: lesson.unlockRule,
    content: lesson.content
      ? {
          objectKey: lesson.content.objectKey ?? undefined,
          videoDuration: lesson.content.videoDuration ?? undefined,
          textContent: lesson.content.textContent ?? undefined,
        }
      : undefined,
    attachments: lesson.attachments.map(toLessonAttachmentResponse),
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

export function toLessonAttachmentResponse(
  attachment: LessonAttachmentMapperInput,
): LessonAttachmentResponseDto {
  return {
    id: attachment.id,
    lessonId: attachment.lessonId,
    fileName: attachment.fileName,
    objectKey: attachment.objectKey,
    resourceType: attachment.resourceType,
    size: attachment.size,
    mimeType: attachment.mimeType,
    createdAt: attachment.createdAt,
  };
}
