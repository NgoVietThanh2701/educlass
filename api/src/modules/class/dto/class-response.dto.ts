export class ClassResponseDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  teacher?: {
    id: string;
    fullName: string;
    userName: string;
  };
  studentCount: number;
}

export class ClassDetailResponseDto extends ClassResponseDto {
  students: {
    joinedAt: Date;
    student: {
      id: string;
      fullName: string;
      email: string | null;
      userName: string;
    };
  }[];
}
