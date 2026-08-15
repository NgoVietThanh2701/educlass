import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { Course, TeacherCourse } from "../types/course.type";

/**
 * Fetch the list of courses created by the current TEACHER.
 * Backend: GET /api/v1/teacher/courses  → returns `CourseTeacherListItemDto[]`.
 */
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  const response = await axiosInstance.get<ApiResponse<TeacherCourse[]>>(
    API_ENDPOINT.TEACHER_COURSES,
  );

  return response.data.data;
}

/**
 * Fetch the list of courses the current STUDENT is enrolled in.
 * Backend: GET /api/v1/student/courses  → returns `CourseListItemDto[]` (no `status`).
 */
export async function getStudentCourses(): Promise<Course[]> {
  const response = await axiosInstance.get<ApiResponse<Course[]>>(
    API_ENDPOINT.STUDENT_COURSES,
  );

  return response.data.data;
}
