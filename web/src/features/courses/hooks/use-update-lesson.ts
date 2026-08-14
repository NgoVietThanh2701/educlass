import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { uploadVideoToCloudinary } from "@/lib/cloudinary";
import { getErrorMessage } from "@/lib/error-message";
import { updateLesson } from "../api/update-lesson";
import { upsertLessonContent } from "../api/upsert-lesson-content";
import { getVideoDurationSeconds } from "../utils/video";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import { COURSE_QUERY_KEYS } from "./use-courses";
import type { CreateLessonRequest } from "../types/lesson.type";

interface UpdateLessonContext {
  courseId: string;
  sectionId: string;
  lessonId: string;
}

export interface UpdateLessonInput {
  /** Updated `CreateLessonDto` fields. */
  data: CreateLessonRequest;
  /** For VIDEO lessons: a newly selected file replaces the existing video. */
  video?: File | null;
  /** For TEXT lessons: the article body. */
  textContent?: string;
  /** Upload-progress callback (0-100) for the direct-to-CDN video upload. */
  onUploadProgress?: (percent: number) => void;
}

/**
 * Edit a lesson: its metadata is patched first (`PATCH`), then the content is
 * synced to the chosen `type` — for VIDEO a new file is uploaded DIRECTLY to
 * Cloudinary and attached; for TEXT the article body is upserted (and any prior
 * video `objectKey`/duration is cleared so the content matches the type).
 */
export function useUpdateLesson({ courseId, sectionId, lessonId }: UpdateLessonContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLessonInput): Promise<void> => {
      await updateLesson(courseId, sectionId, lessonId, input.data);

      if (input.data.type === "VIDEO") {
        if (input.video) {
          const durationSeconds = Math.round(await getVideoDurationSeconds(input.video));
          const { publicId } = await uploadVideoToCloudinary(input.video, {
            onProgress: input.onUploadProgress,
          });
          await upsertLessonContent(courseId, sectionId, lessonId, {
            objectKey: publicId,
            videoDuration: durationSeconds,
            textContent: null, // a new video replaces any previous article body
          });
        }
        // No new file selected → keep the existing video content untouched.
      } else {
        await upsertLessonContent(courseId, sectionId, lessonId, {
          textContent: input.textContent ?? "",
          objectKey: null, // switching to TEXT drops any prior video
          videoDuration: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã cập nhật bài học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}