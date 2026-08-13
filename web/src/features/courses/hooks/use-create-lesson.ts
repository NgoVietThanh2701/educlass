import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createLesson } from "../api/create-lesson";
import { uploadLessonAttachment } from "../api/upload-lesson-attachment";
import { upsertLessonContent } from "../api/upsert-lesson-content";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import { COURSE_QUERY_KEYS } from "./use-courses";
import type { CreateLessonRequest, LessonResponse } from "../types/lesson.type";

export interface CreateLessonContext {
  courseId: string;
  sectionId: string;
}

export interface CreateLessonInput {
  /** `CreateLessonDto` fields (order is auto-assigned by the backend). */
  data: CreateLessonRequest;
  /** Optional lesson video, uploaded & processed on the frontend. */
  video?: File | null;
}

/** Resolve the duration (in whole seconds) of a video `File` in the browser. */
function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);

    const revoke = () => URL.revokeObjectURL(objectUrl);
    video.onloadedmetadata = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      revoke();
      resolve(duration);
    };
    video.onerror = () => {
      revoke();
      resolve(0);
    };
    video.src = objectUrl;
  });
}

/**
 * Create a lesson for the current TEACHER. The lesson metadata is created first
 * (JSON), then — when a video is selected — the file is uploaded on the
 * frontend, its duration is read from the browser, and the resulting `objectKey`
 * is attached to the lesson content. Finally both the teacher course list and the
 * affected course detail are invalidated so the new lesson shows up instantly.
 */
export function useCreateLesson({ courseId, sectionId }: CreateLessonContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLessonInput): Promise<LessonResponse> => {
      const lesson = await createLesson(courseId, sectionId, input.data);

      if (input.video) {
        const attachment = await uploadLessonAttachment(
          courseId,
          sectionId,
          lesson.id,
          input.video,
        );
        const durationSeconds = Math.round(
          await getVideoDurationSeconds(input.video),
        );
        await upsertLessonContent(courseId, sectionId, lesson.id, {
          objectKey: attachment.objectKey,
          videoDuration: durationSeconds,
        });
      }

      return lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
    },
  });
}
