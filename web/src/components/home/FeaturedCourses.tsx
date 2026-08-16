"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Users,
} from "lucide-react";

import Container from "@/components/layout/public/Container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { usePublicCourses } from "@/features/courses/hooks/use-courses";
import { LEVEL_LABELS } from "@/features/courses/constants/course";
import { formatDate, formatPrice } from "@/features/courses/utils/format";
import type { Course, CourseLevel } from "@/features/courses/types/course.type";
import { useEmblaCarousel } from "@/hooks/use-embla-carousel";
import { cn } from "@/lib/utils";

function coursePrice(price: number | undefined | null): string {
  if (price === undefined || price === null || Number.isNaN(price)) return "-";
  return price > 0 ? formatPrice(price) : "Miễn phí";
}

/**
 * Deterministic pseudo rating (3.5 → 4.9) derived from the course id. This is
 * placeholder data until real review/rating data is wired up — tied to the id
 * so the value stays stable across re-renders (no flicker).
 */
function fakeRating(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 3.5 + (hash % 15) / 10;
}

function CourseCardFallback() {
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

function FeaturedCourseCard({ course }: { course: Course }) {
  return (
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
          <span className="truncate">{course.teacherName ?? "Giáo viên"}</span>
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
  );
}

export default function FeaturedCourses() {
  const { data, isLoading, isError } = usePublicCourses({ page: 1, limit: 6 });
  const items = data?.data ?? [];
  const carouselEnabled = !isLoading && !isError && items.length > 0;
  const { viewportRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useEmblaCarousel({
      enabled: carouselEnabled,
      slidesVersion: items.length,
      options: { align: "start", containScroll: "trimSnaps" },
    });

  return (
    <section className="w-full border-t border-border/60 bg-muted/30">
      <Container className="py-10 sm:py-12 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Khóa học nổi bật
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Những khóa học được nhiều học viên lựa chọn nhất
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Xem khóa học trước"
                disabled={!canScrollPrev}
                onClick={scrollPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Xem khóa học tiếp theo"
                disabled={!canScrollNext}
                onClick={scrollNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Link
              href={ROUTES.COURSE_LIST}
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              Tất cả khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 sm:w-64">
                <CourseCardFallback />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
            Không thể tải danh sách khóa học. Vui lòng thử lại sau.
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
            Chưa có khóa học nổi bật nào.
          </p>
        ) : (
          <div className="embla relative">
            <div ref={viewportRef} className="embla__viewport overflow-hidden">
              <div className="embla__container flex">
                {items.map((course) => (
                  <div
                    key={course.id}
                    className="embla__slide shrink-0 grow-0 basis-full px-2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <FeaturedCourseCard course={course} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
