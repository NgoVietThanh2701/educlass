import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type {
  AssessmentQuiz,
  Attempt,
  SyncAnswersRequest,
} from "../types/attempt.type";

const ATTEMPTS = API_ENDPOINT.ATTEMPTS;

/**
 * Start a new attempt for the current student.
 * Backend: POST /attempts/start { assessmentId } → `AttemptResponseDto`
 * (includes `deadlineAt` used by the client countdown).
 */
export async function startAttempt(
  assessmentId: string,
): Promise<Attempt> {
  const response = await axiosInstance.post<ApiResponse<Attempt>>(
    `${ATTEMPTS}/start`,
    { assessmentId },
  );
  return response.data.data;
}

/**
 * Auto-save the currently answered questions during an attempt.
 * Backend: PUT /attempts/:id/answers (the DTO requires a non-empty answer list,
 * so only answered questions are sent).
 */
export async function syncAttemptAnswers(
  attemptId: string,
  answers: SyncAnswersRequest["answers"],
): Promise<void> {
  if (answers.length === 0) return;
  await axiosInstance.put(`${ATTEMPTS}/${attemptId}/answers`, { answers });
}

/** Submit the attempt — the backend computes the score. POST /attempts/:id/submit. */
export async function submitAttempt(attemptId: string): Promise<Attempt> {
  const response = await axiosInstance.post<ApiResponse<Attempt>>(
    `${ATTEMPTS}/${attemptId}/submit`,
  );
  return response.data.data;
}

/** Fetch a single attempt (its saved answers). GET /attempts/:id. */
export async function getAttempt(attemptId: string): Promise<Attempt> {
  const response = await axiosInstance.get<ApiResponse<Attempt>>(
    `${ATTEMPTS}/${attemptId}`,
  );
  return response.data.data;
}

/**
 * Student quiz payload — questions + options WITHOUT the answer key.
 * GET /student/courses/:courseId/assessments/:assessmentId
 */
export async function getStudentAssessmentQuiz(
  courseId: string,
  assessmentId: string,
): Promise<AssessmentQuiz> {
  const response = await axiosInstance.get<ApiResponse<AssessmentQuiz>>(
    `${API_ENDPOINT.STUDENT_COURSES}/${courseId}/assessments/${assessmentId}`,
  );
  return response.data.data;
}