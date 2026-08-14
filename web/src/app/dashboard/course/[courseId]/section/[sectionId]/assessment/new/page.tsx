"use client";

import { useParams } from "next/navigation";

import CreateAssessmentPage from "@/features/assessment/components/create-assessment-page";

export default function NewAssessmentPage() {
  const params = useParams<{ courseId: string; sectionId: string }>();

  return (
    <CreateAssessmentPage
      courseId={params.courseId}
      sectionId={params.sectionId}
    />
  );
}