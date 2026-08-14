"use client";

import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCloudinaryVideoUrl } from "@/lib/cloudinary";
import type { CourseDetailLesson } from "../../types/course-detail.type";

interface ViewLessonModalProps {
  lesson: CourseDetailLesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL: Record<CourseDetailLesson["type"], string> = {
  VIDEO: "Video",
  TEXT: "Bài viết",
};

/** Modal that lets the teacher view a lesson's content (video / article). */
export default function ViewLessonModal({
  lesson,
  open,
  onOpenChange,
}: ViewLessonModalProps) {
  const videoUrl = lesson.content?.objectKey
    ? getCloudinaryVideoUrl(lesson.content.objectKey)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0">
              {TYPE_LABEL[lesson.type]}
            </Badge>
            {lesson.description && (
              <span className="truncate">{lesson.description}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {lesson.type === "VIDEO" ? (
            videoUrl ? (
              <video
                controls
                className="w-full rounded-md border border-border bg-black"
                src={videoUrl}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Bài học video chưa có nội dung.
              </p>
            )
          ) : lesson.content?.textContent ? (
            <div className="space-y-2 text-sm leading-relaxed">
              {lesson.content.textContent
                .split("\n")
                .filter(Boolean)
                .map((line, index) => (
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
                      {Math.max(1, Math.round(attachment.size / 1024))} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}