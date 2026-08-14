"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteLesson } from "../../hooks/use-delete-lesson";
import type { CourseDetailLesson } from "../../types/course-detail.type";

interface DeleteLessonModalProps {
  courseId: string;
  sectionId: string;
  lesson: CourseDetailLesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation dialog for deleting a lesson (with its content/attachments). */
export default function DeleteLessonModal({
  courseId,
  sectionId,
  lesson,
  open,
  onOpenChange,
}: DeleteLessonModalProps) {
  const deleteMutation = useDeleteLesson();
  const isPending = deleteMutation.isPending;

  const close = () => onOpenChange(false);

  const handleDelete = () => {
    deleteMutation.mutate(
      { courseId, sectionId, lessonId: lesson.id },
      {
        onSuccess: () => close(),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa bài học</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa bài học “{lesson.title}”? Nội dung, tệp đính kèm
            và tiến độ học của bài sẽ bị xóa vĩnh viễn. Hành động này không thể
            hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Xóa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}