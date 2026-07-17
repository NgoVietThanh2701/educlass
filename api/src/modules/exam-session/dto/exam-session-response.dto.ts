// Định nghĩa ngay trong mapper hoặc tạo file riêng
export class ExamSessionResponseDto {
  id: string;
  examId: string;
  classId: string;
  name: string | null;
  startAt: Date;
  sessionDelayMinutes: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  exam?: { id: string; title: string };
  class?: { id: string; name: string };
}
