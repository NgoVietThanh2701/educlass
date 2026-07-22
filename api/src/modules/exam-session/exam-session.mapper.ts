import { convertUtcToVietnamTime } from '@common/utils/format-time.util';
import { Prisma } from '@prisma/client';
import { ExamSessionResponseDto } from './dto/exam-session-response.dto';

export const examSessionSelect = Prisma.validator<Prisma.ExamSessionSelect>()({
  id: true,
  name: true,
  startAt: true,
  endAt: true,
  sessionDelayMinutes: true,
  status: true,
  createdAt: true,
  exam: {
    select: {
      id: true,
      title: true,
      duration: true,
    },
  },
  class: {
    select: {
      id: true,
      name: true,
      teacherId: true,
    },
  },
  _count: {
    select: { attempts: true },
  },
});

export type ExamSessionWithRelations = Prisma.ExamSessionGetPayload<{
  select: typeof examSessionSelect;
}>;

export function toExamSessionResponse(session: ExamSessionWithRelations): ExamSessionResponseDto {
  return {
    id: session.id,
    name: session.name,
    startAt: convertUtcToVietnamTime(session.startAt),
    endAt: convertUtcToVietnamTime(session.endAt),
    sessionDelayMinutes: session.sessionDelayMinutes,
    status: session.status,
    createdAt: convertUtcToVietnamTime(session.createdAt),
    exam: session.exam,
    class: session.class,
    attemptCount: session._count.attempts,
  };
}
