"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileQuestion,
  FileText,
  PlayCircle,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  sections: CourseDetailSection[];
  /** Optional callback fired when the teacher wants to add a lesson to a section. */
  onAddLesson?: (sectionId: string) => void;
}

/** Expandable list of sections; each section reveals its lessons/assessments when opened. */
export function CourseSections({
  sections,
  onAddLesson,
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

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Khóa học chưa có phần học nào.</p>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isOpen = expandedIds.has(section.id);
        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-lg border border-border"
          >
            {/* Section header (button toggles expand/collapse) */}
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="flex w-full items-center gap-2 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/70"
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
              {onAddLesson && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLesson(section.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Bài học</span>
                </Button>
              )}
            </button>

            {/* Collapsible content */}
            {isOpen && (
              <div className="divide-y divide-border">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    {lesson.type === "VIDEO" ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">
                      {lesson.order}. {lesson.title}
                    </span>
                    {lesson.isPreview && (
                      <Badge variant="outline" className="shrink-0">
                        Xem thử
                      </Badge>
                    )}
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
