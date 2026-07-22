import { convertUtcToVietnamTime } from '@common/utils/format-time.util';
import { Prisma, QuestionType } from '@prisma/client';
import { AttemptResponseDto } from './dto/attempt-response.dto';

export const attemptSelectResponse = Prisma.validator<Prisma.ExamAttemptSelect>()({
  id: true,
  sessionId: true,
  studentId: true,
  startedAt: true,
  finishedAt: true,
  deadlineAt: true,
  score: true,
  status: true,
  session: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
    },
  },
  answers: {
    select: {
      questionId: true,
      optionId: true,
    },
  },
});

export const attemptSelect = Prisma.validator<Prisma.ExamAttemptSelect>()({
  // id: true,
  // sessionId: true,
  // studentId: true,
  // startedAt: true,
  // finishedAt: true,
  // deadlineAt: true,
  // score: true,
  // status: true,
  ...attemptSelectResponse,
  session: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      exam: {
        select: {
          id: true,
          title: true,
          duration: true,
          questions: {
            select: {
              id: true,
              type: true,
              score: true,
              options: {
                select: {
                  id: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      },
      class: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  },
  // answers: {
  //   select: {
  //     questionId: true,
  //     optionId: true,
  //   },
  // },
});

export type AttemptWithRelations = Prisma.ExamAttemptGetPayload<{
  select: typeof attemptSelectResponse;
}>;

export function toAttemptResponse(attempt: AttemptWithRelations): AttemptResponseDto {
  return {
    id: attempt.id,
    sessionId: attempt.sessionId,
    studentId: attempt.studentId,
    startedAt: convertUtcToVietnamTime(attempt.startedAt),
    finishedAt: attempt.finishedAt ? convertUtcToVietnamTime(attempt.finishedAt) : null,
    deadlineAt: convertUtcToVietnamTime(attempt.deadlineAt),
    score: attempt.score?.toNumber() ?? null,
    status: attempt.status,
    answers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      optionId: a.optionId,
    })),
  };
}

export type ExamQuestionForScoring = {
  id: string;
  score: Prisma.Decimal;
  type: QuestionType;
  options: {
    id: string;
    isCorrect: boolean;
  }[];
};
