"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileQuestion,
  FileText,
  Lock,
  PlayCircle,
  CheckCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  PlayerItem,
  StudentCourseSection,
} from "../types/student-course.type";

export interface StudentCurriculumTreeProps {
  sections: StudentCourseSection[];
  /** sectionIds whose prerequisites (all lessons completed) are met. */
  unlockedSectionIds?: Set<string>;
  currentId?: string;
  currentKind?: "lesson" | "assessment";
  collapsible?: boolean;
  onNavigate: (item: PlayerItem) => void;
}

/**
 * Shared curriculum tree (player sidebar + hub overview). Lessons whose
 * prerequisites are incomplete render a `Lock` and are non-interactive;
 * completed lessons show a checkmark; the current item is highlighted.
 */
export function StudentCurriculumTree({
  sections,
  unlockedSectionIds,
  currentId,
  currentKind,
  collapsible = true,
  onNavigate,
}: StudentCurriculumTreeProps) {
  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  const [openIds, setOpenIds] = useState<Set<string>>(
    sorted.length ? new Set([sorted[0].id]) : new Set(),
  );

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rowClass =
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm";

  return (
    <nav className="space-y-2">
      {sorted.map((section) => {
        const isOpen = !collapsible || openIds.has(section.id);
        const lessons = section.lessons
          .slice()
          .sort((a, b) => a.order - b.order);
        const assessments = section.assessments
          .slice()
          .sort((a, b) => a.order - b.order);
        const sectionUnlocked = unlockedSectionIds
          ? unlockedSectionIds.has(section.id)
          : true;

        return (
          <div key={section.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="p-0.5 hover:bg-muted rounded"
                  aria-label={isOpen ? "Thu gọn" : "Mở rộng"}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <span className="text-sm font-semibold">
                Phần {section.order}: {section.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {lessons.length} bài học · {assessments.length} KT
              </span>
            </div>

            {isOpen && (
              <div className="pl-1 space-y-0.5">
                {lessons.map((lesson) => {
                  const item: PlayerItem = {
                    kind: "lesson",
                    id: lesson.id,
                    sectionId: section.id,
                    data: lesson,
                  };
                  const active =
                    currentKind === "lesson" && currentId === lesson.id;
                  const locked = !sectionUnlocked || !lesson.isUnlocked;
                  const completed = lesson.progress?.completed;
                  const Icon =
                    lesson.type === "VIDEO" ? PlayCircle : FileText;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onNavigate(item)}
                      className={cn(
                        rowClass,
                        locked &&
                          "cursor-not-allowed opacity-60 text-muted-foreground",
                        active && "bg-primary/10 text-primary",
                        !locked && !active && completed && "font-medium",
                      )}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4 shrink-0" />
                      ) : completed ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Icon className="h-4 w-4 shrink-0" />
                      )}
                      <span className="flex-1 truncate">
                        {lesson.order}. {lesson.title}
                      </span>
                      {active && (
                        <span className="shrink-0 text-[10px] font-medium uppercase text-primary">
                          Đang học
                        </span>
                      )}
                    </button>
                  );
                })}

                {assessments.map((assessment) => {
                  const item: PlayerItem = {
                    kind: "assessment",
                    id: assessment.id,
                    sectionId: section.id,
                    data: assessment,
                  };
                  const active =
                    currentKind === "assessment" &&
                    currentId === assessment.id;
                  const locked = !sectionUnlocked;
                  return (
                    <button
                      key={assessment.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onNavigate(item)}
                      className={cn(
                        rowClass,
                        locked &&
                          "cursor-not-allowed opacity-60 text-muted-foreground",
                        active && "bg-primary/10 text-primary",
                        !locked &&
                          !active &&
                          "hover:bg-muted",
                      )}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4 shrink-0" />
                      ) : (
                        <FileQuestion className="h-4 w-4 shrink-0" />
                      )}
                      <span className="flex-1 truncate">
                        Bài kiểm tra: {assessment.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {assessment.questionCount ?? 0} câu
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}