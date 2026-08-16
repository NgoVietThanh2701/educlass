"use client";

import { Clock, FileText, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  ASSESSMENT_STATUS_CONFIG,
  LESSON_TYPE_LABELS,
} from "../constants/course";
import type { LessonResponse } from "../types/lesson.type";
import type { StudentCourseAssessment } from "../types/student-course.type";
import { LessonContentArea } from "./lesson-content";

interface LessonContentRendererProps {
  lesson: LessonResponse | undefined;
}

/**
 * Player content renderer: header (title + type badge) plus the shared
 * `LessonContentArea` (video/text + attachments).
 */
export function LessonContentRenderer({
  lesson,
}: LessonContentRendererProps) {
  if (!lesson) return null;

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{lesson.title}</h2>
        <Badge variant="outline" className="shrink-0">
          {LESSON_TYPE_LABELS[lesson.type]}
        </Badge>
      </header>

      <LessonContentArea lesson={lesson} variant="player" />
    </article>
  );
}

interface AssessmentContentProps {
  assessment: StudentCourseAssessment;
}

/**
 * Assessment slot in the player. The full quiz/answer engine
 * (answer selection, auto-save, submit) is intentionally out of scope here —
 * this renders the assessment metadata + a CTA marking where it plugs in.
 */
export function AssessmentContent({ assessment }: AssessmentContentProps) {
  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">
          Bài kiểm tra: {assessment.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {ASSESSMENT_STATUS_CONFIG[assessment.status].label}
          </Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {assessment.duration} phút
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {assessment.questionCount ?? 0} câu hỏi
          </span>
        </div>
      </header>

      {assessment.description && (
        <p className="text-sm text-muted-foreground">
          {assessment.description}
        </p>
      )}

      <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        <Lock className="mx-auto mb-2 h-8 w-8" />
        <p className="mb-2">
          Tính năng làm bài kiểm tra (chọn câu trả lời, nộp bài, xem kết quả)
          sẽ được cập nhật trong các bản cập nhật tiếp theo.
        </p>
      </div>
    </article>
  );
}