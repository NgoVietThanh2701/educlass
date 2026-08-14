import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type {
  AssessmentDetail,
  AssessmentQuestion,
  CreateAssessmentRequest,
  OptionInput,
  QuestionInput,
} from "../types/assessment.type";

const ASSESSMENTS = `${API_ENDPOINT.ASSESSMENT}`;
const questionsUrl = (assessmentId: string) => `${ASSESSMENTS}/${assessmentId}/questions`;

// ===================== ASSESSMENT =====================
export async function createAssessment(
  data: CreateAssessmentRequest,
): Promise<AssessmentDetail> {
  const response = await axiosInstance.post<ApiResponse<AssessmentDetail>>(
    ASSESSMENTS,
    data,
  );
  return response.data.data;
}

export async function getAssessmentDetail(
  assessmentId: string,
): Promise<AssessmentDetail> {
  const response = await axiosInstance.get<ApiResponse<AssessmentDetail>>(
    `${ASSESSMENTS}/${assessmentId}`,
  );
  return response.data.data;
}

// ===================== QUESTION =====================
export async function createQuestion(
  assessmentId: string,
  data: QuestionInput,
): Promise<AssessmentQuestion> {
  const response = await axiosInstance.post<ApiResponse<AssessmentQuestion>>(
    questionsUrl(assessmentId),
    data,
  );
  return response.data.data;
}

export async function updateQuestion(
  assessmentId: string,
  questionId: string,
  data: Pick<QuestionInput, "content" | "explanation" | "score" | "type">,
): Promise<AssessmentQuestion> {
  const response = await axiosInstance.patch<ApiResponse<AssessmentQuestion>>(
    `${questionsUrl(assessmentId)}/${questionId}`,
    data,
  );
  return response.data.data;
}

export async function deleteQuestion(
  assessmentId: string,
  questionId: string,
): Promise<void> {
  await axiosInstance.delete(`${questionsUrl(assessmentId)}/${questionId}`);
}

export async function reorderQuestions(
  assessmentId: string,
  orderedIds: string[],
): Promise<void> {
  await axiosInstance.patch(`${questionsUrl(assessmentId)}/reorder`, {
    orderedIds,
  });
}

// ===================== OPTION =====================
export async function addOption(
  assessmentId: string,
  questionId: string,
  data: Omit<OptionInput, "id">,
): Promise<AssessmentQuestion["options"][number]> {
  const response = await axiosInstance.post<ApiResponse<
    AssessmentQuestion["options"][number]
  >>(`${questionsUrl(assessmentId)}/${questionId}/options`, data);
  return response.data.data;
}

export async function updateOption(
  assessmentId: string,
  questionId: string,
  optionId: string,
  data: Omit<OptionInput, "id">,
): Promise<void> {
  await axiosInstance.patch(
    `${questionsUrl(assessmentId)}/${questionId}/options/${optionId}`,
    data,
  );
}

export async function deleteOption(
  assessmentId: string,
  questionId: string,
  optionId: string,
): Promise<void> {
  await axiosInstance.delete(
    `${questionsUrl(assessmentId)}/${questionId}/options/${optionId}`,
  );
}