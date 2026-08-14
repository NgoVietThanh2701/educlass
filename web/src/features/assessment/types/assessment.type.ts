export type QuestionType = "SINGLE" | "MULTIPLE";

export interface AssessmentOption {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  content: string;
  explanation: string | null;
  score: number;
  order: number;
  type: QuestionType;
  options: AssessmentOption[];
}

export interface AssessmentDetail {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  status: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  questions: AssessmentQuestion[];
}

// ---- Request payloads (mirror backend DTOs) ----
export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  duration: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  sectionId: string;
}

export interface OptionInput {
  /** Present for options that already exist (update) — omit for new ones. */
  id?: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionInput {
  content: string;
  explanation?: string;
  score: number;
  type: QuestionType;
  options: OptionInput[];
}