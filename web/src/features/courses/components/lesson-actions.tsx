"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CourseDetailLesson } from "../types/course-detail.type";
import ViewLessonModal from "./modals/view-lesson-modal";
import EditLessonModal from "./modals/edit-lesson-modal";
import DeleteLessonModal from "./modals/delete-lesson-modal";

export interface LessonActionsProps {
  courseId: string;
  sectionId: string;
  lesson: CourseDetailLesson;
  /** Disables the action buttons (e.g. while a reorder is being saved). */
  disabled?: boolean;
  /** Optional callback fired after an edit/delete completes successfully. */
  onChanged?: () => void;
}

/**
 * The set of row actions for a lesson: view its content, edit it (metadata +
 * content) or delete it. Each action opens a dedicated modal.
 */
export function LessonActions({
  courseId,
  sectionId,
  lesson,
  disabled = false,
  onChanged,
}: LessonActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Xem bài học"
          disabled={disabled}
          onClick={() => setViewOpen(true)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Xem bài học</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Sửa bài học"
          disabled={disabled}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Sửa bài học</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Xóa bài học"
          disabled={disabled}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Xóa bài học</span>
        </Button>
      </div>

      {/* Keyed by lesson id so each modal re-seeds when a different lesson opens. */}
      <ViewLessonModal
        key={`view-${lesson.id}`}
        lesson={lesson}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <EditLessonModal
        key={`edit-${lesson.id}`}
        courseId={courseId}
        sectionId={sectionId}
        lesson={lesson}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onChanged}
      />
      <DeleteLessonModal
        key={`delete-${lesson.id}`}
        courseId={courseId}
        sectionId={sectionId}
        lesson={lesson}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}