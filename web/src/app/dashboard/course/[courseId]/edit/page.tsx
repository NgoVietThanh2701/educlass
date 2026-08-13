"use client";

import { useParams } from "next/navigation";

import EditCourseForm from "@/features/courses/components/edit-course-form";

export default function CourseEditPage() {
  const params = useParams<{ courseId: string }>();

  return <EditCourseForm courseId={params.courseId} />;
}
