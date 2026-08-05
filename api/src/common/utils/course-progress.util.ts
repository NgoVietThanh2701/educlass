export interface CourseProgressPayload {
  courseId: string;
  studentId: string;
  totalLessons: number;
  completedLessons: number;
}

export function buildCourseProgressPayload({
  courseId,
  studentId,
  totalLessons,
  completedLessons,
}: CourseProgressPayload) {
  const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    courseId,
    studentId,
    totalLessons,
    completedLessons,
    percent,
    completed: percent >= 100,
  };
}
