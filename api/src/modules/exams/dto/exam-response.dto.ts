// DTO for response

export class ExamResponseDto {
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
