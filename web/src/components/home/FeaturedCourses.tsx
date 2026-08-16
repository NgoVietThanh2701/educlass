"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import Container from "@/components/layout/public/Container";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { usePublicCourses } from "@/features/courses/hooks/use-courses";
import { useEmblaCarousel } from "@/hooks/use-embla-carousel";
import { cn } from "@/lib/utils";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "./public-course-card";

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
                <PublicCourseCardSkeleton />
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
                    <PublicCourseCard course={course} />
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
