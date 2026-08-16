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

/**
 * Fetch published courses for public discovery (homepage "featured courses").
 * Backend: GET /api/v1/public/courses?page=1&limit=6 → `{ data, meta }`. Always
 * available (no auth); each item is enriched with `teacherName` + `students`.
 */
export interface CourseListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Paginated response for the public course catalog. */
export interface PaginatedCourses {
  data: Course[];
  meta: CourseListMeta;
}

export async function getPublicCourses(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedCourses> {
  const response = await axiosInstance.get<ApiResponse<PaginatedCourses>>(
    API_ENDPOINT.PUBLIC_COURSES,
    { params },
  );

  return response.data.data;
}
