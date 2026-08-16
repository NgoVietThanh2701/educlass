import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/error-message";
import { getStudentLesson } from "../api/get-student-lesson";
import {
  upsertLessonProgress,
  type UpdateLessonProgressRequest,
} from "../api/update-lesson-progress";

export const STUDENT_LESSON_QUERY_KEY = ["courses", "student-lesson"] as const;

/**
 * Full lesson content for a student (video/text + attachments).
 *
 * Endpoint: GET /api/v1/courses/:courseId/sections/:sectionId/lessons/student/:lessonId
 * Only enabled when every path param is present (the player passes `undefined`
 * for `lessonId` while viewing an assessment or a locked lesson).
 */
export function useStudentLesson(
  courseId: string | undefined,
  sectionId: string | undefined,
  lessonId: string | undefined,
) {
  return useQuery({
    queryKey: [
      ...STUDENT_LESSON_QUERY_KEY,
      courseId,
      sectionId,
      lessonId,
    ] as const,
    queryFn: () =>
      getStudentLesson(
        courseId as string,
        sectionId as string,
        lessonId as string,
      ),
    enabled: Boolean(courseId && sectionId && lessonId),
    staleTime: 5 * 60_000,
  });
}

/**
 * Save/update the current student's progress on a lesson (`completed`,
 * `lastPosition`). On success the student-course-detail cache is invalidated so
 * the sidebar and overall progress re-reflect completion (and downstream lesson
 * unlocking) immediately.
 */
export function useUpsertLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      lessonId,
      data,
    }: {
      courseId: string;
      sectionId: string;
      lessonId: string;
      data: UpdateLessonProgressRequest;
    }) => upsertLessonProgress(courseId, sectionId, lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", "student-detail"],
      });
      queryClient.invalidateQueries({ queryKey: ["courses", "student-lesson"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
