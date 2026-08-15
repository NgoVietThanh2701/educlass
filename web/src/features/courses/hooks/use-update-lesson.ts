import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { uploadVideoToCloudinary } from "@/lib/cloudinary";
import { getErrorMessage } from "@/lib/error-message";
import { updateLesson } from "../api/update-lesson";
import { upsertLessonContent } from "../api/upsert-lesson-content";
import { getVideoDurationSeconds } from "../utils/video";
import type {
  CourseDetailLesson,
  CourseTeacherDetail,
} from "../types/course-detail.type";
import type { CreateLessonRequest } from "../types/lesson.type";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import { COURSE_QUERY_KEYS } from "./use-courses";

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

export interface UpdateLessonResult {
  /** Present when a NEW video was attached (VIDEO + new file). */
  objectKey?: string;
  videoDuration?: number;
}

/**
 * Build the lesson object that should appear in the course-detail cache after
 * this update, from what we already know client-side (metadata + chosen
 * type/content). The *existing* lesson is returned for VIDEO-unchanged so the
 * untouched video fields are preserved.
 */
function buildPatchedLesson(
  lesson: CourseDetailLesson,
  input: UpdateLessonInput,
  result: UpdateLessonResult,
): CourseDetailLesson {
  const content =
    input.data.type === "TEXT"
      ? {
          objectKey: null,
          videoDuration: null,
          textContent: input.textContent ?? "",
        }
      : result.objectKey
        ? {
            objectKey: result.objectKey,
            videoDuration: result.videoDuration ?? null,
            textContent: null,
          }
        : lesson.content;

  return { ...lesson, ...input.data, content };
}

/**
 * Edit a lesson: its metadata is patched first (`PATCH`), then the content is
 * synced to the chosen `type` — for VIDEO a new file is uploaded DIRECTLY to
 * Cloudinary and attached; for TEXT the article body is upserted (and any prior
 * video `objectKey`/duration is cleared so the content matches the type).
 *
 * On success the cached course detail is patched optimistically so the UI
 * updates in the same tick the toast appears — the background refetch only
 * reconciles the optimistic value with the server (no user-visible delay).
 */
export function useUpdateLesson({ courseId, sectionId, lessonId }: UpdateLessonContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLessonInput): Promise<UpdateLessonResult> => {
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
          return { objectKey: publicId, videoDuration: durationSeconds };
        }
        // No new file selected → keep the existing video content untouched.
        return {};
      }

      await upsertLessonContent(courseId, sectionId, lessonId, {
        textContent: input.textContent ?? "",
        objectKey: null, // switching to TEXT drops any prior video
        videoDuration: null,
      });
      return {};
    },

    onSuccess: (result, input) => {
      // Optimistic cache patch → the section tree updates instantly, without
      // waiting for the upcoming background refetch (the detail endpoint is
      // heavy: it also returns every assessment with its questions/options).
      queryClient.setQueryData<CourseTeacherDetail>(
        [...COURSE_DETAIL_QUERY_KEY, courseId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            sections: old.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    lessons: section.lessons.map((lesson) =>
                      lesson.id === lessonId
                        ? buildPatchedLesson(lesson, input, result)
                        : lesson,
                    ),
                  }
                : section,
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã cập nhật bài học.");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}