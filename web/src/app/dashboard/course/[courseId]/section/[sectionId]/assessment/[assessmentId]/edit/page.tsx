"use client";

import { useParams } from "next/navigation";

import CreateAssessmentPage from "@/features/assessment/components/create-assessment-page";

export default function EditAssessmentPage() {
  const params = useParams<{
    courseId: string;
    sectionId: string;
    assessmentId: string;
  }>();

  return (
    <CreateAssessmentPage
      courseId={params.courseId}
      sectionId={params.sectionId}
      assessmentId={params.assessmentId}
    />
  );
}