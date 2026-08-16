"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LESSON_TYPE_LABELS } from "../../constants/course";
import type { CourseDetailLesson } from "../../types/course-detail.type";
import { LessonContentArea } from "../lesson-content";

interface ViewLessonModalProps {
  lesson: CourseDetailLesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal that lets the teacher view a lesson's content (video / article). */
export default function ViewLessonModal({
  lesson,
  open,
  onOpenChange,
}: ViewLessonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0">
              {LESSON_TYPE_LABELS[lesson.type]}
            </Badge>
            {lesson.description && (
              <span className="truncate">{lesson.description}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <LessonContentArea lesson={lesson} variant="dialog" />
      </DialogContent>
    </Dialog>
  );
}