import type { QuestionType } from "./assessment.type";

/** Order these from the backend `AssessmentAttemptStatus`/`AttemptStatus` enum. */
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMEOUT";

/** A single saved answer inside a student attempt. */
export interface AttemptAnswer {
  questionId: string;
  optionId: string;
}

/**
 * Per-question scoring result returned by the backend after submit/timeout
 * (`AttemptResponseDto.questionResults`). Lets the client render a per-question
 * review (đúng / sai) + reveal the correct options.
 */
export interface QuestionResult {
  questionId: string;
  correct: boolean;
  correctOptionIds: string[];
}

/** Mirrors the backend `AttemptResponseDto` (`POST /attempts/start`, ...). */
export interface Attempt {
  id: string;
  assessmentId: string;
  studentId: string;
  startedAt: string;
  finishedAt?: string | null;
  /**
   * Scheduled attempt end time. Backend now emits an **ISO 8601 (UTC)** string
   * (machine-parseable) so the client timer can do `Date.parse` reliably — a
   * localized `toLocaleString('vi-VN')` string would parse to `NaN`.
   */
  deadlineAt: string;
  score: number | null;
  passed: boolean | null;
  status: AttemptStatus;
  /** Flattened saved answers (one entry per selected option). */
  answers: AttemptAnswer[];
  /** Per-question correctness + correct option ids (after submit/timeout). */
  questionResults: QuestionResult[];
}

/** Answer key-free question payload the student sees in the quiz UI. */
export interface QuizQuestion {
  id: string;
  content: string;
  type: QuestionType;
  order: number;
  options: { id: string; content: string; order: number }[];
}

/** Mirrors the backend `StudentAssessmentQuizDto`. */
export interface AssessmentQuiz {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  questionCount: number;
  questions: QuizQuestion[];
}

/** Payload for `PUT /attempts/:id/answers` (`SyncAnswersDto`). */
export interface SyncAnswersRequest {
  answers: { questionId: string; optionIds: string[] }[];
}