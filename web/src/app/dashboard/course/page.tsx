"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import {
  Course,
  CourseStatusFilter,
  TeacherCourse,
} from "@/features/courses/types/course.type";
import { createCourseColumns } from "@/features/courses/components/course-columns";
import { createStudentCourseColumns } from "@/features/courses/components/student-course-columns";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useDeleteCourse } from "@/features/courses/hooks/use-delete-course";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";

const STATUS_OPTIONS: { value: CourseStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PUBLISHED", label: "Đã xuất bản" },
  { value: "ARCHIVED", label: "Đã lưu trữ" },
];

// Badge variant mapping for the status filter trigger.
const STATUS_BADGE_VARIANT: Record<
  CourseStatusFilter,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ALL: "secondary",
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "destructive",
};

export default function CoursePage() {
  const router = useRouter();
  const {
    data: courses = [],
    isLoading,
    isError,
    isFetching,
    refetch,
    isTeacher,
  } = useCourses();
  const deleteMutation = useDeleteCourse();

  const handleView = useCallback(
    (course: Course) => {
      router.push(ROUTES.COURSE_DETAIL.replace(":slug", course.slug));
    },
    [router],
  );

  const handleEdit = useCallback(
    (course: Course) => {
      router.push(ROUTES.COURSE_EDIT.replace(":slug", course.slug));
    },
    [router],
  );

  const handleDelete = useCallback(
    (course: Course) => {
      if (window.confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) {
        deleteMutation.mutate(course.id);
      }
    },
    [deleteMutation],
  );

  // `handleStudy` is the STUDENT entry point: route to the student learning hub.
  // For TEACHERS this callback is never wired up (their rows expose View/Edit/Delete).
  const handleStudy = useCallback(
    (course: Course) => {
      router.push(ROUTES.STUDENT_COURSE_LEARN.replace(":slug", course.slug));
    },
    [router],
  );

  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("ALL");

  const filteredCourses = useMemo(() => {
    if (statusFilter === "ALL" || !isTeacher) {
      return courses;
    }
    // Only the TEACHER list response carries `status`.
    return courses.filter(
      (course) => (course as TeacherCourse).status === statusFilter,
    );
  }, [courses, statusFilter, isTeacher]);

  // Pick the column set per role: leaner, learning-focused columns for STUDENTS.
  const columns = useMemo(
    () =>
      isTeacher
        ? createCourseColumns({
            isTeacher,
            onView: handleView,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onStudy: handleStudy,
          })
        : createStudentCourseColumns({ onStudy: handleStudy }),
    [isTeacher, handleView, handleEdit, handleDelete, handleStudy],
  );

  // Loading state (also covers background retries of transient network errors —
  // `isError` flips true immediately while retrying, so bind the loader to
  // `isFetching` instead of flashing the error then replacing it with data).
  if (isLoading || (isError && isFetching)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Đang tải khóa học...
        </span>
      </div>
    );
  }

  // Error state.
  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">
          Không thể tải danh sách khóa học.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const currentLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ?? "Tất cả";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Khóa học</h1>

          {/* Status filter — TEACHER only */}
          {isTeacher && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Trạng thái:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 gap-1.5">
                    <Badge
                      variant={STATUS_BADGE_VARIANT[statusFilter]}
                      className="font-medium"
                    >
                      {currentLabel}
                    </Badge>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Chọn trạng thái</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as CourseStatusFilter)
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* New course — TEACHER only */}
        {isTeacher && (
          <div className="mt-4 flex items-center gap-3 sm:mt-0">
            <Button onClick={() => router.push(ROUTES.COURSE_CREATE)}>
              Thêm khóa học mới
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {isTeacher
            ? `Đang hiển thị ${filteredCourses.length} khóa học`
            : `Bạn đang tham gia ${filteredCourses.length} khóa học`}
        </div>
        <DataTable
          columns={columns}
          data={filteredCourses}
          pageSize={10}
          className="mt-0"
        />
      </div>
    </div>
  );
}
