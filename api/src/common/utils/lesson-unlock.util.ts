import { LessonUnlockRule } from '@prisma/client';

export type LessonUnlockInput = {
  id: string;
  sectionId: string;
  order: number;
  unlockRule: LessonUnlockRule;
  sectionOrder: number;
};

export type LessonUnlockContext = {
  lessonsBySection: Map<string, LessonUnlockInput[]>;
  completedLessonIds: Set<string>;
  passedAssessmentIds: Set<string>;
  assessmentIdsBeforeSection: Map<number, string[]>;
};

export function buildLessonUnlockContext(
  lessons: LessonUnlockInput[],
  completedLessonIds: Set<string>,
  passedAssessmentIds: Set<string>,
  assessments: Array<{ id: string; sectionOrder: number }>,
): LessonUnlockContext {
  const lessonsBySection = new Map<string, LessonUnlockInput[]>();

  for (const lesson of lessons) {
    const sectionLessons = lessonsBySection.get(lesson.sectionId) ?? [];
    sectionLessons.push(lesson);
    lessonsBySection.set(lesson.sectionId, sectionLessons);
  }

  const assessmentIdsBeforeSection = new Map<number, string[]>();

  for (const assessment of assessments) {
    const bucket = assessmentIdsBeforeSection.get(assessment.sectionOrder) ?? [];
    bucket.push(assessment.id);
    assessmentIdsBeforeSection.set(assessment.sectionOrder, bucket);
  }

  return {
    lessonsBySection,
    completedLessonIds,
    passedAssessmentIds,
    assessmentIdsBeforeSection,
  };
}

export function isLessonUnlocked(lesson: LessonUnlockInput, ctx: LessonUnlockContext): boolean {
  if (lesson.unlockRule === LessonUnlockRule.FREE) {
    return true;
  }

  if (lesson.unlockRule === LessonUnlockRule.PREVIOUS_LESSON) {
    const sectionLessons = ctx.lessonsBySection.get(lesson.sectionId) ?? [];
    const previousLessons = sectionLessons.filter((item) => item.order < lesson.order);

    if (previousLessons.length === 0) {
      return true;
    }

    return previousLessons.every((item) => ctx.completedLessonIds.has(item.id));
  }

  if (lesson.unlockRule === LessonUnlockRule.PREVIOUS_ASSESSMENT) {
    const requiredAssessmentIds: string[] = [];

    for (const [sectionOrder, assessmentIds] of ctx.assessmentIdsBeforeSection.entries()) {
      if (sectionOrder < lesson.sectionOrder) {
        requiredAssessmentIds.push(...assessmentIds);
      }
    }

    if (requiredAssessmentIds.length === 0) {
      return true;
    }

    return requiredAssessmentIds.every((assessmentId) => ctx.passedAssessmentIds.has(assessmentId));
  }

  return true;
}
