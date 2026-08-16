"use client";

import { useParams } from "next/navigation";

import { StudentLessonPlayer } from "@/features/courses/components/student-lesson-player";

/**
 * Assessment slot page — `/dashboard/learn/:slug/assessment/:assessmentId`.
 * (Assessment id is globally unique, so the URL omits the section segment.)
 * Shares the player shell; center area renders the assessment content.
 */
export default function AssessmentPlayerPage() {
  const params = useParams<{
    slug: string;
    assessmentId: string;
  }>();

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col md:-m-6 md:h-[calc(100dvh-5rem)]">
      <StudentLessonPlayer
        slug={params.slug}
        itemId={params.assessmentId}
        itemType="assessment"
      />
    </div>
  );
}