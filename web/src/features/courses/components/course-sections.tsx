"use client";

import { useState, type DragEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  FileText,
  GripVertical,
  Loader2,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LessonActions } from "./lesson-actions";
import type { CourseDetailAssessment, CourseDetailLesson, CourseDetailSection } from "../types/course-detail.type";

const LESSON_TYPE_LABELS: Record<CourseDetailLesson["type"], string> = {
  VIDEO: "Video",
  TEXT: "Bài viết",
};

const ASSESSMENT_STATUS_LABELS: Record<CourseDetailAssessment["status"], string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

interface CourseSectionsProps {
  courseId: string;
  sections: CourseDetailSection[];
  /** Optional callback fired when the teacher wants to add a lesson to a section. */
  onAddLesson?: (sectionId: string) => void;
  /** Move a section to another section's slot (drag & drop). */
  onMoveSection?: (fromId: string, toId: string) => void;
  /** Move a lesson within its own section (drag & drop). */
  onMoveLesson?: (sectionId: string, fromId: string, toId: string) => void;
  /** Fired when the teacher triggers deleting a section. */
  onDeleteSection?: (sectionId: string) => void;
  /** Fired when the teacher wants to create an assessment inside a section. */
  onAddAssessment?: (sectionId: string) => void;
  /** Disables drag re-order + action buttons while a reorder is being saved. */
  busy?: boolean;
}

/** Expandable list of sections; each section reveals its lessons/assessments when opened. */
export function CourseSections({
  courseId,
  sections,
  onAddLesson,
  onMoveSection,
  onMoveLesson,
  onDeleteSection,
  onAddAssessment,
  busy = false,
}: CourseSectionsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  type DragState =
    | { type: "section"; id: string }
    | { type: "lesson"; sectionId: string; id: string };
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const resetDrag = () => {
    setDrag(null);
    setOverId(null);
  };

  const dragOverSectionId = drag?.type === "section" ? overId : null;
  const dragOverLessonId = drag?.type === "lesson" ? overId : null;

  const handleSectionDragStart = (
    e: DragEvent<HTMLSpanElement>,
    id: string,
  ) => {
    if (busy) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDrag({ type: "section", id });
    setOverId(id);
  };

  const handleLessonDragStart = (
    e: DragEvent<HTMLSpanElement>,
    sectionId: string,
    id: string,
  ) => {
    if (busy) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDrag({ type: "lesson", sectionId, id });
    setOverId(id);
  };

  const handleSectionDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (drag?.type !== "section") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  };

  const handleLessonDragOver = (
    e: DragEvent<HTMLDivElement>,
    sectionId: string,
    id: string,
  ) => {
    if (drag?.type !== "lesson" || drag.sectionId !== sectionId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  };

  const handleSectionDrop = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (drag?.type === "section" && drag.id !== id) {
      onMoveSection?.(drag.id, id);
    }
    resetDrag();
  };

  const handleLessonDrop = (
    e: DragEvent<HTMLDivElement>,
    sectionId: string,
    id: string,
  ) => {
    e.preventDefault();
    if (drag?.type === "lesson" && drag.sectionId === sectionId && drag.id !== id) {
      onMoveLesson?.(sectionId, drag.id, id);
    }
    resetDrag();
  };

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Khóa học chưa có phần học nào.</p>
    );
  }

  return (
    <div className="space-y-4">
      {busy && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Đang lưu thứ tự…
        </div>
      )}
      {sections.map((section) => {
        const isOpen = expandedIds.has(section.id);
        return (
          <div
            key={section.id}
            className={cn(
              "overflow-hidden rounded-lg border border-border",
              dragOverSectionId === section.id &&
                "border-primary/60 ring-1 ring-primary/40",
            )}
            onDragOver={(e) => handleSectionDragOver(e, section.id)}
            onDrop={(e) => handleSectionDrop(e, section.id)}
            onDragLeave={() =>
              setOverId((prev) => (prev === section.id ? null : prev))
            }
          >
            {/* Section header (drag handle + button toggles expand/collapse) */}
            <div className="flex w-full items-center gap-1 bg-muted/40 px-2 py-3 transition-colors hover:bg-muted/70">
              <span
                draggable={!busy}
                title={busy ? "Đang lưu thứ tự…" : "Kéo để sắp xếp phần"}
                onDragStart={(e) => handleSectionDragStart(e, section.id)}
                onDragEnd={resetDrag}
                className="shrink-0 cursor-grab px-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 text-sm font-semibold">
                Phần {section.order}: {section.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {section.lessons.length} bài học · {section.assessments.length} kiểm tra
              </span>
              </button>
              {onAddAssessment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAssessment(section.id);
                  }}
                >
                  <ClipboardList className="h-3 w-3" />
                  <span className="hidden sm:inline">Kiểm tra</span>
                </Button>
              )}
              {onAddLesson && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLesson(section.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Bài học</span>
                </Button>
              )}
              {onDeleteSection && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1 text-destructive hover:text-destructive"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Xóa</span>
                </Button>
              )}
            </div>

            {/* Collapsible content */}
            {isOpen && (
              <div className="divide-y divide-border">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5",
                      dragOverLessonId === lesson.id && "bg-muted/40",
                    )}
                    onDragOver={(e) => handleLessonDragOver(e, section.id, lesson.id)}
                    onDrop={(e) => handleLessonDrop(e, section.id, lesson.id)}
                    onDragLeave={() =>
                      setOverId((prev) => (prev === lesson.id ? null : prev))
                    }
                  >
                    <span
                      draggable={!busy}
                      title={busy ? "Đang lưu thứ tự…" : "Kéo để sắp xếp bài học trong phần"}
                      onDragStart={(e) =>
                        handleLessonDragStart(e, section.id, lesson.id)
                      }
                      onDragEnd={resetDrag}
                      className="cursor-grab text-muted-foreground opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing group-hover:opacity-100"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    {lesson.type === "VIDEO" ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">
                      {lesson.order}. {lesson.title}
                    </span>
                    <LessonActions
                      courseId={courseId}
                      sectionId={section.id}
                      lesson={lesson}
                      disabled={busy}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {LESSON_TYPE_LABELS[lesson.type]}
                    </span>
                  </div>
                ))}

                {section.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <FileQuestion className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">
                      Bài kiểm tra: {assessment.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {assessment.questionCount} câu · {assessment.duration} phút
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {ASSESSMENT_STATUS_LABELS[assessment.status]}
                    </span>
                  </div>
                ))}

                {section.lessons.length === 0 &&
                  section.assessments.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      Phần này chưa có nội dung.
                    </p>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
