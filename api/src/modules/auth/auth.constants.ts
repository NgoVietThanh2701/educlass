export type SequenceName = (typeof SEQUENCE)[keyof typeof SEQUENCE];
export const SEQUENCE = {
  TEACHER: 'teacher_seq',
  STUDENT: 'student_seq',
} as const;

export const SALT_ROUNDS = 12;
