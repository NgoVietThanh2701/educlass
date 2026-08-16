import { CalendarDays, Star, User, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { LEVEL_LABELS } from "@/features/courses/constants/course";
import {
  coursePrice,
  formatDate,
} from "@/features/courses/utils/format";
import type { Course, CourseLevel } from "@/features/courses/types/course.type";

/**
 * Deterministic pseudo rating (3.5 → 4.9) derived from the course id. Placeholder
 * until real review/rating data is wired up — stable per course (no flicker).
 */
export function fakeRating(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 3.5 + (hash % 15) / 10;
}

/** Skeleton placeholder while a course list is loading. */
export function PublicCourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[6/5] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Shared public course card: thumbnail, level, title, teacher, date, price, rating, students. */
export function PublicCourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`${ROUTES.COURSE_DETAIL_PUBLIC.replace(":slug", course.slug)}`}
      className="block h-full w-full"
    >
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[6/5] overflow-hidden bg-muted">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Không có ảnh
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-background/90 text-foreground backdrop-blur"
          >
            {LEVEL_LABELS[(course.level ?? "BEGINNER") as CourseLevel]}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">
            {course.title}
          </h3>

          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {course.teacherName ?? "Giáo viên"}
            </span>
            <span aria-hidden className="mx-0.5 text-muted-foreground/50">
              •
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{formatDate(course.publishedAt)}</span>
            </span>
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold text-primary">
              {coursePrice(course.price)}
            </span>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-medium">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="tabular-nums text-foreground">
                  {fakeRating(course.id).toFixed(1)}
                </span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="tabular-nums">{course.students ?? 0}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
