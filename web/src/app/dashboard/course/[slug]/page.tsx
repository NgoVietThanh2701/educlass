"use client";

import { useParams } from "next/navigation";

import CourseDetail from "@/features/courses/components/course-detail";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();

  return <CourseDetail slug={params.slug} />;
}
