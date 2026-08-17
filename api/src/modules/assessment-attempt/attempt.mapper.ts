import { convertUtcToVietnamTime } from '@common/utils/format-time.util';
import { Prisma, QuestionType } from '@prisma/client';
import { AttemptResponseDto } from './dto/attempt-response.dto';

export const attemptSelectResponse = Prisma.validator<Prisma.AssessmentAttemptSelect>()({
  id: true,
  assessmentId: true,
  studentId: true,
  attemptNumber: true,
  startedAt: true,
  finishedAt: true,
  score: true,
  passed: true,
  status: true,
  answers: {
    select: {
      optionId: true,
      option: {
        select: {
          id: true,
          questionId: true,
        },
      },
    },
  },
});

export const attemptSelect = Prisma.validator<Prisma.AssessmentAttemptSelect>()({
  ...attemptSelectResponse,
  assessment: {
    select: {
      id: true,
      title: true,
      duration: true,
      status: true,
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
      section: {
        select: {
          id: true,
          course: {
            select: {
              id: true,
              teacherId: true,
            },
          },
        },
      },
    },
  },
});

export type AttemptMapperInput = Prisma.AssessmentAttemptGetPayload<{
  select: typeof attemptSelectResponse;
}>;

export type QuestionResultInput = {
  questionId: string;
  correct: boolean;
  correctOptionIds: string[];
};

export function toAttemptResponse(
  attempt: AttemptMapperInput,
  deadlineAt: Date,
  questionResults: QuestionResultInput[] = [],
): AttemptResponseDto {
  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    studentId: attempt.studentId,
    startedAt: convertUtcToVietnamTime(attempt.startedAt),
    finishedAt: attempt.finishedAt ? convertUtcToVietnamTime(attempt.finishedAt) : null,
    deadlineAt: deadlineAt.toISOString(),
    score: attempt.score?.toNumber() ?? null,
    passed: attempt.passed,
    status: attempt.status,
    answers: attempt.answers.map((a) => ({
      questionId: a.option.questionId,
      optionId: a.optionId,
    })),
    questionResults: questionResults.map((q) => ({
      questionId: q.questionId,
      correct: q.correct,
      correctOptionIds: q.correctOptionIds,
    })),
  };
}

export type AssessmentQuestionForScoring = {
  id: string;
  score: Prisma.Decimal;
  type: QuestionType;
  options: {
    id: string;
    isCorrect: boolean;
  }[];
};
