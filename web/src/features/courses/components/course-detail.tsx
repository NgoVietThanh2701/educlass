"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileQuestion,
  Loader2,
  Pencil,
  PlayCircle,
  FileText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { RoleUser } from "@/types/role.type";
import { LEVEL_LABELS, STATUS_CONFIG } from "../constants/course";
import { useTeacherCourseDetail } from "../hooks/use-course-detail";
import type { CourseDetailAssessment, CourseDetailLesson } from "../types/course-detail.type";
import { formatDate, formatPrice } from "../utils/format";

const LESSON_TYPE_LABELS: Record<CourseDetailLesson["type"], string> = {
  VIDEO: "Video",
  TEXT: "Bài viết",
};

const ASSESSMENT_STATUS_CONFIG: Record<
  CourseDetailAssessment["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  DRAFT: { label: "Bản nháp", variant: "secondary" },
  PUBLISHED: { label: "Đã xuất bản", variant: "default" },
  ARCHIVED: { label: "Đã lưu trữ", variant: "destructive" },
};

interface MetaItemProps {
  label: string;
  value: string | number;
}

function MetaItem({ label, value }: MetaItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** Split a multiline string into non-empty lines for bullet rendering. */
function splitLines(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CourseDetail({ courseId }: { courseId: string }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const { data: course, isLoading, isError, isFetching, refetch } =
    useTeacherCourseDetail(courseId);

  if (role === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== RoleUser.TEACHER) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">Bạn không có quyền xem khóa học này.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(ROUTES.COURSE)}
        >
          Quay lại danh sách khóa học
        </Button>
      </div>
    );
  }

  // During a background retry of a transient network error, `isError` is already
  // true while `isFetching` stays truthy — keep the loader up so we don't flash
  // the error card and then overwrite it with data a moment later.
  if (isLoading || (isError && isFetching)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin khóa học...</span>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">Không thể tải thông tin khóa học.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[course.status];
  const totalLessons = course.sections.reduce(
    (acc, section) => acc + section.lessons.length,
    0,
  );
  const totalAssessments = course.sections.reduce(
    (acc, section) => acc + section.assessments.length,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTES.COURSE)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <Button onClick={() => router.push(ROUTES.COURSE_EDIT.replace(":id", course.id))}>
          <Pencil className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left: thumbnail + quick facts */}
        <div className="space-y-6">
          <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Chưa có ảnh</span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <MetaItem
              label="Cấp độ"
              value={LEVEL_LABELS[course.level] ?? course.level}
            />
            <MetaItem label="Ngôn ngữ" value={course.language.toUpperCase()} />
            <MetaItem label="Giá" value={formatPrice(course.price)} />
            <MetaItem
              label="Thời lượng"
              value={`${course.estimatedDuration ?? 0} phút`}
            />
            <MetaItem label="Ngày xuất bản" value={formatDate(course.publishedAt)} />
            <MetaItem label="Ngày tạo" value={formatDate(course.createdAt)} />
            <MetaItem label="Số phần" value={course.sections.length} />
            <MetaItem label="Bài học" value={totalLessons} />
          </dl>
        </div>

        {/* Right: content */}
        <div className="space-y-8">
          {/* Description */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">Mô tả khóa học</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {course.description || "-"}
            </p>
          </section>

          {/* Requirements & outcomes */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <section className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold">Yêu cầu đầu vào</h3>
              {splitLines(course.requirements).length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {splitLines(course.requirements).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </section>

            <section className="rounded-lg border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold">Kết quả đạt được</h3>
              {splitLines(course.learningOutcomes).length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {splitLines(course.learningOutcomes).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </section>
          </div>

          {/* Curriculum */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold">Chương trình học</h2>
              <span className="text-sm text-muted-foreground">
                ({course.sections.length} phần · {totalLessons} bài học ·{" "}
                {totalAssessments} bài kiểm tra)
              </span>
            </div>

            {course.sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Khóa học chưa có phần học nào.
              </p>
            ) : (
              <div className="space-y-4">
                {course.sections.map((section) => (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
                      <h3 className="text-sm font-semibold">
                        Phần {section.order}: {section.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {section.lessons.length} bài học ·{" "}
                        {section.assessments.length} kiểm tra
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          {lesson.type === "VIDEO" ? (
                            <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="flex-1 truncate text-sm">
                            {lesson.order}. {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {LESSON_TYPE_LABELS[lesson.type]}
                          </span>
                        </div>
                      ))}

                      {section.assessments.map((assessment) => {
                        const config =
                          ASSESSMENT_STATUS_CONFIG[assessment.status];
                        return (
                          <div
                            key={assessment.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <FileQuestion className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-sm">
                              Bài kiểm tra: {assessment.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {assessment.questionCount} câu · {assessment.duration} phút
                            </span>
                            <Badge variant={config.variant} className="shrink-0">
                              {config.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
