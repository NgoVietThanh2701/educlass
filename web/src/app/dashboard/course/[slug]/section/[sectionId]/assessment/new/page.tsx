"use client";

import { useParams } from "next/navigation";

import CreateAssessmentPage from "@/features/assessment/components/create-assessment-page";

export default function NewAssessmentPage() {
  const params = useParams<{ slug: string; sectionId: string }>();

  return (
    <CreateAssessmentPage courseId={params.slug} sectionId={params.sectionId} />
  );
}
