import { FileText, PlayCircle } from "lucide-react";

import { getCloudinaryVideoUrl } from "@/lib/cloudinary";

import { splitLines } from "../utils/format";
import type { LessonType } from "../types/course-detail.type";

/**
 * Minimal structural type both `CourseDetailLesson` (teacher detail) and
 * `LessonResponse` (student lesson content) satisfy — so the shared body below
 * works for every surface that renders a lesson's video/article + attachments.
 */
export interface LessonContentViewDatum {
  type: LessonType;
  content?: {
    objectKey?: string | null;
    videoDuration?: number | null;
    textContent?: string | null;
  } | null;
  attachments: { id: string; fileName: string; size?: number }[];
}

interface LessonContentAreaProps {
  lesson: LessonContentViewDatum;
  /**
   * `dialog` — compact video layout (teacher preview modal).
   * `player` — constrained video height for the full-page student player.
   */
  variant?: "dialog" | "player";
}

/**
 * Shared lesson content body: video (from the Cloudinary `objectKey`) OR
 * text/article paragraphs, plus the attachment list. Used both by the teacher's
 * view-lesson modal and the student player's content renderer so the two never
 * drift apart (single source of truth, same empty states).
 */
export function LessonContentArea({
  lesson,
  variant = "dialog",
}: LessonContentAreaProps) {
  const videoUrl = lesson.content?.objectKey
    ? getCloudinaryVideoUrl(lesson.content.objectKey)
    : null;

  return (
    <div className="space-y-4">
      {lesson.type === "VIDEO" ? (
        videoUrl ? (
          variant === "player" ? (
            <div className="relative w-full max-w-3xl rounded-lg bg-black">
              <video
                controls
                className="h-auto w-full max-h-[55vh] rounded-lg border border-border"
                src={videoUrl}
              />
            </div>
          ) : (
            <video
              controls
              className="w-full rounded-md border border-border bg-black"
              src={videoUrl}
            />
          )
        ) : variant === "player" ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-8 text-sm text-muted-foreground">
            <PlayCircle className="h-8 w-8" />
            <p>Bài học video chưa có nội dung.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bài học video chưa có nội dung.
          </p>
        )
      ) : lesson.content?.textContent ? (
        <div className="space-y-2 text-sm leading-relaxed">
          {splitLines(lesson.content.textContent).map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Bài học chưa có nội dung.
        </p>
      )}

      {lesson.attachments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tệp đính kèm ({lesson.attachments.length})
          </p>
          <ul className="space-y-1 text-sm">
            {lesson.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{attachment.fileName}</span>
                <span className="ml-auto shrink-0 text-xs">
                  {Math.max(1, Math.round((attachment.size ?? 0) / 1024))} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}