// DTO for response

export class AssessmentResponseDto {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  status: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdAt: Date;
  questionCount?: number;
}

export class QuestionResponseDto {
  id: string;
  content: string;
  explanation: string | null;
  score: number;
  order: number;
  type: string;
  options?: OptionResponseDto[];
}

export class OptionResponseDto {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

/** Lightweight assessment row embedded in the teacher course-detail tree (no questions). */
export class AssessmentTeacherItemDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number;
  status: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  createdAt: Date;
  updatedAt: Date;
}
