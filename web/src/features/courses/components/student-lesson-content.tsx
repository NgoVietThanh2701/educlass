"use client";

import { Badge } from "@/components/ui/badge";

import { StudentAssessmentQuiz } from "@/features/assessment/components/student-assessment-quiz";
import { LESSON_TYPE_LABELS } from "../constants/course";
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
  courseId: string;
  assessment: StudentCourseAssessment;
}

/** Assessment slot in the learning player. */
export function AssessmentContent({ courseId, assessment }: AssessmentContentProps) {
  return <StudentAssessmentQuiz courseId={courseId} assessment={assessment} />;
}