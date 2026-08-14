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
import { useDeleteSection } from "../../hooks/use-delete-section";
import type { CourseDetailSection } from "../../types/course-detail.type";

interface DeleteSectionModalProps {
  courseId: string;
  section: CourseDetailSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation dialog for deleting a section (lessons + assessments cascade). */
export default function DeleteSectionModal({
  courseId,
  section,
  open,
  onOpenChange,
}: DeleteSectionModalProps) {
  const deleteMutation = useDeleteSection(courseId);
  const isPending = deleteMutation.isPending;

  const close = () => onOpenChange(false);

  const handleDelete = () => {
    deleteMutation.mutate(section.id, {
      onSuccess: () => close(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa phần học</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa phần “{section.title}”? Toàn bộ bài học, bài
            kiểm tra và tiến độ học trong phần sẽ bị xóa vĩnh viễn. Hành động
            này không thể hoàn tác.
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