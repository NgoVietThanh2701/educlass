import { Prisma } from '@prisma/client';
import { ClassDetailResponseDto, ClassResponseDto } from './dto/class-response.dto';

export const classSelect = Prisma.validator<Prisma.ClassSelect>()({
  id: true,
  name: true,
  description: true,
  code: true,
  createdAt: true,
  teacher: {
    select: {
      id: true,
      fullName: true,
      userName: true,
    },
  },
  _count: {
    select: {
      classStudents: true,
    },
  },
});

export type ClassWithRelations = Prisma.ClassGetPayload<{
  select: typeof classSelect;
}>;

export function toClassResponse(data: ClassWithRelations): ClassResponseDto {
  const { _count, ...classData } = data;

  return {
    ...classData,
    studentCount: _count.classStudents,
  };
}

export const classDetailSelect = Prisma.validator<Prisma.ClassSelect>()({
  ...classSelect,
  teacherId: true,
  classStudents: {
    select: {
      joinedAt: true,
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          userName: true,
        },
      },
    },
  },
});

export type ClassDetailWithRelations = Prisma.ClassGetPayload<{
  select: typeof classDetailSelect;
}>;

export function toClassDetailResponse(data: ClassDetailWithRelations): ClassDetailResponseDto {
  const { classStudents, _count, ...classData } = data;

  return {
    ...classData,
    studentCount: _count.classStudents,
    students: classStudents,
  };
}
