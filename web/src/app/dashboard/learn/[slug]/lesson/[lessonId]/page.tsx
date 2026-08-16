"use client";

import { useParams } from "next/navigation";

import { StudentLessonPlayer } from "@/features/courses/components/student-lesson-player";

/**
 * Lesson player page — `/dashboard/learn/:slug/lesson/:lessonId`.
 * (Lesson id is globally unique, so the URL omits the section segment.)
 * Delegates layout/content/progress/prev-next to `StudentLessonPlayer`.
 */
export default function LessonPlayerPage() {
  const params = useParams<{
    slug: string;
    lessonId: string;
  }>();

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col md:-m-6 md:h-[calc(100dvh-5rem)]">
      <StudentLessonPlayer
        slug={params.slug}
        itemId={params.lessonId}
        itemType="lesson"
      />
    </div>
  );
}