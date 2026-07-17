import { Prisma } from '@prisma/client';

export const examSessionSelect = Prisma.validator<Prisma.ExamSessionSelect>()({
  id: true,
  examId: true,
  classId: true,
  name: true,
  startAt: true,
  sessionDelayMinutes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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

export function toExamSessionResponse(session: ExamSessionWithRelations) {
  return {
    id: session.id,
    examId: session.examId,
    classId: session.classId,
    name: session.name,
    startAt: session.startAt,
    sessionDelayMinutes: session.sessionDelayMinutes,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    exam: session.exam,
    class: session.class,
    attemptCount: session._count.attempts,
  };
}
