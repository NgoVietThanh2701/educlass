"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { StudentCurriculumTree } from "@/features/courses/components/student-curriculum-tree";
import {
  AssessmentContent,
  LessonContentRenderer,
} from "@/features/courses/components/student-lesson-content";
import { LEVEL_LABELS } from "@/features/courses/constants/course";
import { useStudentCourse } from "@/features/courses/hooks/use-student-course";
import {
  useStudentLesson,
  useUpsertLessonProgress,
} from "@/features/courses/hooks/use-student-lesson";
import {
  computeUnlockedSections,
  flattenPlayerNav,
  playerItemToPath,
} from "@/features/courses/utils/player-utils";
import type { CourseLevel } from "@/features/courses/types/course.type";
import type { PlayerItem } from "@/features/courses/types/student-course.type";

export interface StudentLessonPlayerProps {
  slug: string;
  itemId: string;
  itemType: "lesson" | "assessment";
}

/**
 * Learning "player" for an enrolled student.
 *
 * Layout (per spec):
 *  - top: course name + overall progress bar
 *  - left: collapsible curriculum tree (sections -> lessons/assessments); locked
 *    lessons (unmet prerequisites) are non-interactive
 *  - center: dynamic content — lesson (video/article) or assessment slot
 *  - bottom: prev / next navigation
 *
 * Lock rules (server-authoritative + progressive UI gate):
 *  - Lesson-level `isUnlocked` comes from the student-course-detail endpoint.
 *  - Section-level: lessons/assessments of a section unlock only when the
 *    previous section is fully completed (`computeUnlockedSections`).
 * The player only *renders* the lock and refuses to fetch content / mark
 * complete for a locked lesson.
 *
 * Prev/Next walk the strictly adjacent item in curriculum order (no jumping
 * across sections); locked neighbors still render their lock gate.
 */
export function StudentLessonPlayer({
  slug,
  itemId,
  itemType,
}: StudentLessonPlayerProps) {
  const router = useRouter();
  const course = useStudentCourse(slug);
  const {
    data: detail,
    courseId,
    isLoading,
    isError,
    refetch,
    isResolving,
  } = course;

  // Ordered, flattened navigation (lessons + assessments) with unlock state.
  const nav = flattenPlayerNav(detail?.sections ?? []);
  const unlockedSectionIds = computeUnlockedSections(detail?.sections ?? []);
  const currentIndex = nav.findIndex(
    (item) => item.id === itemId && item.kind === itemType,
  );
  const currentItem: PlayerItem | undefined =
    currentIndex >= 0 ? nav[currentIndex] : undefined;

  // A locked lesson (own unlock rule OR its section is not yet unlocked).
  const isLocked =
    currentItem?.kind === "lesson" &&
    (!currentItem.data.isUnlocked ||
      !unlockedSectionIds.has(currentItem.sectionId));

  // Deep-link / stale-item safety: jump to the first unlocked lesson.
  useEffect(() => {
    if (detail && currentIndex === -1 && nav.length > 0) {
      const first = nav.find(
        (item) => item.kind === "lesson" && item.data.isUnlocked,
      );
      if (first) router.replace(playerItemToPath(slug, first));
    }
  }, [detail, currentIndex, nav, slug, router]);

  // Prev/next = exactly the adjacent item in curriculum order; locked items are
  // reached too (they render the lock gate) — never skip to a different section.
  const prevItem =
    currentIndex > 0 ? nav[currentIndex - 1] : undefined;
  const nextItem =
    currentIndex >= 0 && currentIndex < nav.length - 1
      ? nav[currentIndex + 1]
      : undefined;

  // Only fetch lesson *content* when the current lesson is actually unlocked.
  const lessonIdToFetch =
    currentItem?.kind === "lesson" && !isLocked ? itemId : undefined;
  const lessonContent = useStudentLesson(
    courseId,
    currentItem?.sectionId,
    lessonIdToFetch,
  );
  const { mutate: markComplete } = useUpsertLessonProgress();

  const go = (item?: PlayerItem) => {
    if (item) router.push(playerItemToPath(slug, item));
  };

  const handleComplete = (item?: PlayerItem) => {
    const target = item ?? currentItem;
    if (!courseId || !target || target.kind !== "lesson") return;
    markComplete({
      courseId,
      sectionId: target.sectionId,
      lessonId: target.id,
      data: { completed: true },
    });
  };

  // Auto-progress: advancing to the next lesson marks the CURRENT (being
  // finished) lesson complete — no manual "mark complete" button needed.
  const handleNext = () => {
    if (currentItem?.kind === "lesson" && !isLocked) {
      handleComplete(currentItem);
    }
    go(nextItem);
  };
if (isLoading || isResolving || !detail) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Đang tải trang học…</span>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">Không thể tải khóa học.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const progress = detail.progress;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Top: course name + overall progress bar */}
      <header className="flex items-center gap-3 border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2"
          onClick={() => router.push(ROUTES.COURSE)}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại khóa học
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{detail.title}</h1>
          <p className="text-xs text-muted-foreground">
            {progress.completedLessons}/{progress.totalLessons} bài học ·{" "}
            {Math.round(progress.percent)}% hoàn thành
          </p>
        </div>

        <Badge variant="outline" className="shrink-0">
          {LEVEL_LABELS[detail.level as CourseLevel]}
        </Badge>

        <div className="h-2 w-32 min-w-[80px] shrink-0 overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: curriculum tree (locked lessons/assessments are non-interactive) */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-border p-3 md:block">
          <StudentCurriculumTree
            sections={detail.sections}
            unlockedSectionIds={unlockedSectionIds}
            currentId={itemId}
            currentKind={itemType}
            onNavigate={(item) => go(item)}
          />
        </aside>

        {/* Center: dynamic content per lesson / assessment */}
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {currentItem?.kind === "lesson" ? (
            isLocked ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <Lock className="h-10 w-10" />
                <p className="font-medium">Bài học đã khóa</p>
                <p className="text-sm">
                  Hãy hoàn thành các bài học/điều kiện trước để mở khóa.
                </p>
              </div>
            ) : lessonContent.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải nội dung bài học…</span>
              </div>
            ) : lessonContent.isError ? (
              <p className="text-sm text-destructive">
                Không tải được nội dung bài học.
              </p>
            ) : lessonContent.data ? (
              <LessonContentRenderer lesson={lessonContent.data} />
            ) : null
          ) : currentItem?.kind === "assessment" ? (
            <AssessmentContent assessment={currentItem.data} />
          ) : (
            <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>
          )}
        </main>
      </div>

      {/* Bottom: prev / next (adjacent in curriculum order) */}
      <footer className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!prevItem}
          onClick={() => go(prevItem)}
        >
          <ChevronLeft className="h-4 w-4" />
          Bài trước
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!nextItem}
          onClick={handleNext}
        >
          Bài kế tiếp
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}