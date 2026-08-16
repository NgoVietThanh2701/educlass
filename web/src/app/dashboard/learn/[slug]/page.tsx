"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  LEVEL_LABELS,
  CATEGORY_LABELS,
} from "@/features/courses/constants/course";
import { formatPrice, splitLines } from "@/features/courses/utils/format";
import { useStudentCourse } from "@/features/courses/hooks/use-student-course";
import {
  flattenPlayerNav,
  playerItemToPath,
} from "@/features/courses/utils/player-utils";
import { StudentCurriculumTree } from "@/features/courses/components/student-curriculum-tree";
import type {
  CourseCategory,
  CourseLevel,
} from "@/features/courses/types/course.type";

export default function StudentLearnPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const {
    data: course,
    category,
    isLoading,
    isError,
    isResolving,
    refetch,
  } = useStudentCourse(slug);

  const nav = useMemo(() => flattenPlayerNav(course?.sections ?? []), [
    course?.sections,
  ]);
  const firstUnlocked = nav.find(
    (item) => item.kind === "lesson" && item.data.isUnlocked,
  );

  if (isLoading || isResolving || !course) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Đang tải trang học...
        </span>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">
          Không thể tải nội dung khóa học.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const progress = course.progress;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => router.push(ROUTES.COURSE)}
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại khóa học của tôi
      </Button>

      {/* Overall progress */}
      <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
        <Badge variant="outline">
          {LEVEL_LABELS[course.level as CourseLevel]}
        </Badge>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.completedLessons}/{progress.totalLessons} bài học
            </span>
            <span>{Math.round(progress.percent)}% hoàn thành</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Media + start CTA */}
        <div className="lg:sticky lg:top-6 lg:w-1/2">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full rounded-lg border object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
              Không có ảnh
            </div>
          )}

          <Button
            className="mt-4 w-full gap-1.5"
            disabled={!firstUnlocked}
            onClick={() =>
              firstUnlocked && router.push(playerItemToPath(slug, firstUnlocked))
            }
          >
            <PlayCircle className="h-4 w-4" />
            {course.price === 0 ? "Bắt đầu học" : "Vào khóa học"}
          </Button>
        </div>

        {/* Info + curriculum */}
        <div className="flex-1 space-y-6">
                    <header className="space-y-3">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {LEVEL_LABELS[course.level as CourseLevel]}
              </Badge>
              {category && (
                <Badge variant="secondary">
                  {CATEGORY_LABELS[category as CourseCategory]}
                </Badge>
              )}
              <Badge variant="outline">{course.language}</Badge>
              <Badge variant="outline">
                {course.price === 0 ? "Miễn phí" : formatPrice(course.price)}
              </Badge>
            </div>
          </header>

          {course.shortDescription && (
            <p className="text-sm text-muted-foreground">
              {course.shortDescription}
            </p>
          )}

          {course.requirements && (
            <section className="space-y-1">
              <h2 className="text-sm font-semibold">Yêu cầu</h2>
              <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                {splitLines(course.requirements).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {course.learningOutcomes && (
            <section className="space-y-1">
              <h2 className="text-sm font-semibold">Bạn sẽ học được gì</h2>
              <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                {splitLines(course.learningOutcomes).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Curriculum (locked lessons + completion state) */}
          <section className="space-y-3 pt-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Chương trình học</h2>
              <span className="text-sm text-muted-foreground">
                {course.sections.length} phần · {progress.totalLessons} bài học
              </span>
            </div>

            <StudentCurriculumTree
              sections={course.sections}
              collapsible={false}
              onNavigate={(item) => router.push(playerItemToPath(slug, item))}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
