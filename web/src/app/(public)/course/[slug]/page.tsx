"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Award,
  FileQuestion,
  FileText,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

import Container from "@/components/layout/public/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useEnrollCourse } from "@/features/enrollments/hooks/use-enroll-course";
import { usePublicCourse } from "@/features/courses/hooks/use-courses";
import {
  ASSESSMENT_STATUS_CONFIG,
  LEVEL_LABELS,
  LESSON_TYPE_LABELS,
} from "@/features/courses/constants/course";
import { coursePrice, formatDate } from "@/features/courses/utils/format";
import { RoleUser } from "@/types/role.type";

function levelLabel(level?: string | null): string {
  if (!level) return "-";
  return (LEVEL_LABELS as Record<string, string>)[level] ?? level;
}

function languageLabel(language?: string): string {
  if (language === "vi") return "Tiếng Việt";
  if (language === "en") return "English";
  return language ?? "-";
}

function PublicCourseLoading() {
  return (
    <Container className="py-12">
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Đang tải thông tin khóa học...</span>
      </div>
    </Container>
  );
}

function PublicCourseNotFound() {
  return (
    <Container className="py-12">
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Khóa học không tồn tại hoặc đã ngưng công bố.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          Quay lại
        </Button>
      </div>
    </Container>
  );
}

export default function PublicCoursePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { data: course, isLoading, isError } = usePublicCourse(slug);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const enroll = useEnrollCourse();

  const [joined, setJoined] = useState(false);
  const isStudent =
    !isInitializing && isAuthenticated && user?.role === RoleUser.STUDENT;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    if (!course?.id) return;
    if (isStudent) {
      try {
        await enroll.mutateAsync(course.id);
        setJoined(true);
        toast.success("Đã tham gia khóa học!");
      } catch {
        toast.error("Không thể tham gia khóa học. Vui lòng thử lại.");
      }
    }
  };

  const totalLessons = useMemo(
    () => course?.sections.reduce((a, s) => a + s.lessons.length, 0) ?? 0,
    [course],
  );
  const totalAssessments = useMemo(
    () => course?.sections.reduce((a, s) => a + s.assessments.length, 0) ?? 0,
    [course],
  );

  if (isLoading) return <PublicCourseLoading />;
  if (isError || !course) return <PublicCourseNotFound />;

  return (
    <section className="border-t border-border/60 bg-muted/30">
      <Container className="py-10 sm:py-12 lg:py-14">
        <div className="space-y-10">
          <div className="flex items-start gap-6">
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] w-1/2 min-w-48 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
              {course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Không có ảnh
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <header className="space-y-3">
                <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {course.title}
                </h1>
                <p className="text-muted-foreground">
                  {course.shortDescription}
                </p>
              </header>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {course.estimatedDuration != null && (
                  <span>{course.estimatedDuration} phút</span>
                )}
                <span>
                  {totalLessons} bài học · {totalAssessments} bài kiểm tra
                </span>
                {course.publishedAt && (
                  <span>Đã đăng: {formatDate(course.publishedAt)}</span>
                )}
                <span>{languageLabel(course.language)}</span>
              </div>

              {/* Category / level / price badges */}
              <div className="flex flex-wrap gap-2">
                {course.category && <Badge>{course.category}</Badge>}
                <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                <Badge variant="outline" className="font-mono">
                  {coursePrice(course.price)}
                </Badge>
              </div>

              {/* Price + join CTA */}
              <div className="pt-2">
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-primary">
                    {coursePrice(course.price)}
                  </div>
                  <p className="text-xs text-muted-foreground">Giá khóa học</p>
                </div>

                <div className="mt-3">
                  {!isAuthenticated ? (
                    <Button
                      className="w-full gap-2"
                      onClick={() => router.push(ROUTES.LOGIN)}
                    >
                      <Award className="h-4 w-4" />
                      Tham gia ngay (đăng nhập)
                    </Button>
                  ) : isStudent ? (
                    joined ? (
                      <Badge className="w-full justify-center py-1.5">
                        Đã tham gia
                      </Badge>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        disabled={enroll.isPending}
                        onClick={handleJoin}
                      >
                        {enroll.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Award className="h-4 w-4" />
                        )}
                        Tham gia ngay
                      </Button>
                    )
                  ) : (
                    <Button className="w-full" disabled>
                      Chỉ dành cho học viên
                    </Button>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Thanh toán sẽ được bổ sung trong bản cập nhật tới.
                </p>
              </div>
            </div>
            {/* End info column */}
          </div>
          {/* End course header row */}

          {/* Description */}
          {course.description && (
            <section className="space-y-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Mô tả khóa học
              </h2>
              <div className="prose prose-sm max-w-none break-words text-muted-foreground">
                {course.description}
              </div>
            </section>
          )}

          {/* Requirements (kept for data parity, hidden in layout) */}

          {/* Learning outcomes (kept for data parity, hidden in layout) */}

          {/* Curriculum */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Lộ trình khóa học
            </h2>

            {course.sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Khóa học chưa có phần học nào.
              </p>
            ) : (
              <div className="space-y-3">
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
                        {section.lessons.length} bài ·{" "}
                        {section.assessments.length} KT
                      </span>
                    </div>

                    <ul className="divide-y divide-border">
                      {section.lessons.map((lesson) => (
                        <li
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
                        </li>
                      ))}

                      {section.assessments.map((assessment) => {
                        const config =
                          ASSESSMENT_STATUS_CONFIG[assessment.status];
                        return (
                          <li
                            key={assessment.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <FileQuestion className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-sm">
                              Bài kiểm tra: {assessment.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {assessment.duration} phút
                            </span>
                            <Badge variant={config.variant}>
                              {config.label}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </section>
  );
}
