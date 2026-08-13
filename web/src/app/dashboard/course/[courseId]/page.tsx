"use client";

import { useParams } from "next/navigation";

import CourseDetail from "@/features/courses/components/course-detail";

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();

  return <CourseDetail courseId={params.courseId} />;
}
