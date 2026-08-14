import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { uploadVideoToCloudinary } from "@/lib/cloudinary";
import { getErrorMessage } from "@/lib/error-message";
import { createLesson } from "../api/create-lesson";
import { upsertLessonContent } from "../api/upsert-lesson-content";
import { getVideoDurationSeconds } from "../utils/video";
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
  /** Upload-progress callback (0-100) for the direct-to-CDN video upload. */
  onUploadProgress?: (percent: number) => void;
}

/**
 * Create a lesson for the current TEACHER. The lesson metadata is created first
 * (JSON), then — when a video is selected — the file is uploaded DIRECTLY from
 * the browser to Cloudinary's CDN (see `@/lib/cloudinary`), its duration is read
 * from the browser, and the resulting Cloudinary `public_id` is attached to the
 * lesson content as its `objectKey`. Finally both the teacher course list and
 * the affected course detail are invalidated so the new lesson shows up
 * instantly.
 */
export function useCreateLesson({ courseId, sectionId }: CreateLessonContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLessonInput): Promise<LessonResponse> => {
      const lesson = await createLesson(courseId, sectionId, input.data);

      if (input.video) {
        const durationSeconds = Math.round(
          await getVideoDurationSeconds(input.video),
        );
        // DIRECT client → Cloudinary upload (never routed through the backend).
        const { publicId } = await uploadVideoToCloudinary(input.video, {
          onProgress: input.onUploadProgress,
        });
        await upsertLessonContent(courseId, sectionId, lesson.id, {
          objectKey: publicId,
          videoDuration: durationSeconds,
        });
      }

      return lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã tạo bài học mới.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
