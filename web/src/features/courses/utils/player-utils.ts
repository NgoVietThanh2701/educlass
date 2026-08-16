import { ROUTES } from "@/constants/routes";
import type { PlayerItem, StudentCourseSection } from "../types/student-course.type";

/**
 * Flatten a course's ordered sections into the list the player uses for
 * prev/next navigation and the sidebar tree: lessons (ordered) then
 * assessments (ordered) within each section, sections in order. Backends
 * already return `order`-sorted arrays — re-sort defensively.
 */
export function flattenPlayerNav(
  sections: StudentCourseSection[],
): PlayerItem[] {
  return sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((section) => {
      const lessons = section.lessons.slice().sort((a, b) => a.order - b.order);
      const assessments = section.assessments
        .slice()
        .sort((a, b) => a.order - b.order);

      return [
        ...lessons.map(
          (lesson): PlayerItem => ({
            kind: "lesson",
            id: lesson.id,
            sectionId: section.id,
            data: lesson,
          }),
        ),
        ...assessments.map(
          (assessment): PlayerItem => ({
            kind: "assessment",
            id: assessment.id,
            sectionId: section.id,
            data: assessment,
          }),
        ),
      ];
    });
}

/**
 * Compute which sections are unlocked from the student view.
 * A section unlocks only when **every lesson** in the previous section is marked
 * completed. Section 0 is always unlocked. Lessons within an unlocked section
 * keep their own server-authoritative `isUnlocked` flag; this is purely a
 * progressive UI gate so section[n+1] lessons don't appear actionable until
 * section[n] is fully done.
 */
export function computeUnlockedSections(
  sections: StudentCourseSection[],
): Set<string> {
  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  const set = new Set<string>();
  sorted.forEach((section, i) => {
    if (i === 0) {
      set.add(section.id);
      return;
    }
    const prevOrder = section.order - 1;
    const prev = sorted.find((s) => s.order === prevOrder);
    const allDone = prev?.lessons.every((l) => l.progress?.completed);
    if (allDone) set.add(section.id);
  });
  return set;
}

/**
 * Build the dashboard route for a flattened player item.
 *
 * Lesson and assessment ids are globally unique, so the URL stays short:
 * `/learn/:slug/lesson/:lessonId` or `/learn/:slug/assessment/:assessmentId`
 * (no section segment). The player resolves the section from course detail.
 */
export function playerItemToPath(slug: string, item: PlayerItem): string {
  const s = encodeURIComponent(slug);
  const id = encodeURIComponent(item.id);

  if (item.kind === "lesson") {
    return ROUTES.STUDENT_LESSON.replace(":slug", s).replace(":lessonId", id);
  }
  return ROUTES.STUDENT_ASSESSMENT.replace(":slug", s).replace(
    ":assessmentId",
    id,
  );
}
