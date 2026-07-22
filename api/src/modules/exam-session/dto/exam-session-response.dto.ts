// Định nghĩa ngay trong mapper hoặc tạo file riêng
export class ExamSessionResponseDto {
  id: string;
  name: string | null;
  startAt: string;
  endAt: string;
  sessionDelayMinutes: number;
  status: string;
  createdAt: string;
  attemptCount: number;
  exam: { id: string; title: string };
  class: { id: string; name: string };
}
