"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { RoleUser } from "@/types/role.type";
import { useTeacherCourseDetail } from "../hooks/use-course-detail";
import { useUpdateCourse } from "../hooks/use-update-course";
import { useChangeCourseStatus } from "../hooks/use-change-course-status";
import { useReorderSections } from "../hooks/use-reorder-sections";
import { useReorderLessons } from "../hooks/use-reorder-lessons";
import {
  CreateCourseFormValues,
  createCourseSchema,
  LEVEL_OPTIONS,
} from "../schemas/create-course.schema";
import {
  LANGUAGES,
  type CourseLanguage,
  type CreateCourseLevel,
} from "../types/create-course.type";
import type { CourseStatus } from "../types/course.type";
import type { CourseDetailSection } from "../types/course-detail.type";
import { CourseSections } from "./course-sections";
import CreateSectionModal from "./modals/create-section-modal";
import CreateLessonModal from "./modals/create-lesson-modal";
import DeleteSectionModal from "./modals/delete-section-modal";

const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PUBLISHED", label: "Đã xuất bản" },
  { value: "ARCHIVED", label: "Đã lưu trữ" },
];

export default function EditCourseForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  const { data: course, isLoading, isError, refetch } =
    useTeacherCourseDetail(courseId);
  const updateMutation = useUpdateCourse(courseId);
  const changeStatusMutation = useChangeCourseStatus(courseId);

  const [error, setError] = useState<string | null>(null);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [createLessonSectionId, setCreateLessonSectionId] = useState<
    string | null
  >(null);
  const [sections, setSections] = useState<CourseDetailSection[]>([]);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<
    CourseDetailSection | null
  >(null);

  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      level: "BEGINNER",
      language: "vi",
      price: 0,
      estimatedDuration: 0,
      requirements: "",
      learningOutcomes: "",
    },
  });

  // Prefill the form once the course detail is loaded.
  useEffect(() => {
    if (!course) return;
    form.reset({
      title: course.title ?? "",
      shortDescription: course.shortDescription ?? "",
      description: course.description ?? "",
      level: course.level as CreateCourseLevel,
      language: (course.language as CourseLanguage) ?? "vi",
      price: course.price ?? 0,
      estimatedDuration: course.estimatedDuration ?? 0,
      requirements: course.requirements ?? "",
      learningOutcomes: course.learningOutcomes ?? "",
    });
  }, [course, form]);

  // Keep the draggable curriculum tree in sync with the server data (which is
  // refetched after creates/deletes/reorders). Uses React's documented
  // "adjusting state during render" pattern — the prev value is tracked in
  // *state* (not a ref), so it is safe for the React Compiler lint.
  const [prevServerSections, setPrevServerSections] = useState<
    CourseDetailSection[] | null
  >(null);
  if (course && prevServerSections !== course.sections) {
    setPrevServerSections(course.sections);
    setSections(course.sections);
  }

  const reorderSectionsMutation = useReorderSections(courseId);
  const reorderLessonsMutation = useReorderLessons(courseId);
  // True while any reorder is being persisted — the UI is read-only meanwhile so
  // the user can't stack overlapping drag/drop or delete actions.
  const isReordering =
    reorderSectionsMutation.isPending || reorderLessonsMutation.isPending;

  /** Move a section to the slot of another section (drag & drop reorder). */
  const handleMoveSection = (fromId: string, toId: string) => {
    const fromIndex = sections.findIndex((section) => section.id === fromId);
    if (fromIndex === -1) return;
    const from = sections[fromIndex];
    if (from.id === toId) return;

    const next = sections.filter((section) => section.id !== fromId);
    const insertAt = next.findIndex((section) => section.id === toId);
    if (insertAt === -1) return;
    next.splice(insertAt, 0, from);

    setSections(next);
    reorderSectionsMutation.mutate(next.map((section) => section.id));
  };

  /** Move a lesson within its own section (never across sections). */
  const handleMoveLesson = (sectionId: string, fromId: string, toId: string) => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;
    const from = section.lessons.find((lesson) => lesson.id === fromId);
    if (!from || from.id === toId) return;

    const lessons = section.lessons.filter((lesson) => lesson.id !== fromId);
    const insertAt = lessons.findIndex((lesson) => lesson.id === toId);
    if (insertAt === -1) return;
    lessons.splice(insertAt, 0, from);

    setSections((prev) =>
      prev.map((item) => (item.id === sectionId ? { ...item, lessons } : item)),
    );
    reorderLessonsMutation.mutate({
      sectionId,
      orderedIds: lessons.map((lesson) => lesson.id),
    });
  };

  const goBack = () => router.push(ROUTES.COURSE_DETAIL.replace(":id", courseId));

  const onSubmit = (values: CreateCourseFormValues) => {
    setError(null);
    updateMutation.mutate(
      {
        title: values.title,
        shortDescription: values.shortDescription,
        description: values.description,
        level: values.level,
        language: values.language,
        price: values.price,
        estimatedDuration: values.estimatedDuration,
        requirements: values.requirements || undefined,
        learningOutcomes: values.learningOutcomes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật khóa học thành công!");
          goBack();
        },
        onError: (err) => {
          const apiError = err as { response?: { data?: { message?: string } } };
          setError(
            apiError?.response?.data?.message ??
              "Đã có lỗi xảy ra. Vui lòng thử lại.",
          );
        },
      },
    );
  };

  const handleStatusChange = (status: CourseStatus) => {
    if (!course || status === course.status) return;
    setError(null);
    changeStatusMutation.mutate(
      { status },
      {
        onSuccess: (updated) => {
          toast.success(
            `Trạng thái đã đổi thành "${
              STATUS_OPTIONS.find((o) => o.value === updated.status)?.label ?? ""
            }".`,
          );
        },
        onError: (err) => {
          const apiError = err as { response?: { data?: { message?: string } } };
          setError(
            apiError?.response?.data?.message ??
              "Không thể đổi trạng thái. Vui lòng thử lại.",
          );
        },
      },
    );
  };

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
        <p className="text-sm text-destructive">Bạn không có quyền chỉnh sửa khóa học.</p>
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.COURSE)}>
          Quay lại danh sách khóa học
        </Button>
      </div>
    );
  }

  if (isLoading || !course) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin khóa học...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">Không thể tải thông tin khóa học.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa khóa học</h1>
        </div>

        {/* Status selector (separate endpoint) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trạng thái:</span>
          <Select
            value={course.status}
            onChange={(e) => handleStatusChange(e.target.value as CourseStatus)}
            disabled={changeStatusMutation.isPending}
            className="w-44"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* General info */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-6"
      >
        {/* Thumbnail (read-only: update endpoint doesn't accept a file) */}
        <FormField htmlFor="thumbnail" label="Ảnh đại diện">
          <div className="flex aspect-video w-72 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
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
        </FormField>

        {/* Title */}
        <FormField
          htmlFor="title"
          label="Tên khóa học"
          required
          error={form.formState.errors.title?.message}
        >
          <Input
            id="title"
            placeholder="Tên khóa học"
            maxLength={200}
            disabled={updateMutation.isPending}
            {...form.register("title")}
          />
        </FormField>

        {/* Short description */}
        <FormField
          htmlFor="shortDescription"
          label="Mô tả ngắn"
          required
          error={form.formState.errors.shortDescription?.message}
        >
          <Textarea
            id="shortDescription"
            maxLength={500}
            disabled={updateMutation.isPending}
            {...form.register("shortDescription")}
          />
        </FormField>

        {/* Description */}
        <FormField
          htmlFor="description"
          label="Mô tả chi tiết"
          required
          error={form.formState.errors.description?.message}
        >
          <Textarea
            id="description"
            rows={5}
            disabled={updateMutation.isPending}
            {...form.register("description")}
          />
        </FormField>

        {/* Level + Language */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="level"
            label="Cấp độ"
            error={form.formState.errors.level?.message}
          >
            <Select id="level" disabled={updateMutation.isPending} {...form.register("level")}>
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            htmlFor="language"
            label="Ngôn ngữ"
            error={form.formState.errors.language?.message}
          >
            <Select id="language" disabled={updateMutation.isPending} {...form.register("language")}>
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Price + Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="price"
            label="Giá (VND)"
            required
            error={form.formState.errors.price?.message}
          >
            <Input
              id="price"
              type="number"
              min={0}
              step="1000"
              disabled={updateMutation.isPending}
              {...form.register("price", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            htmlFor="estimatedDuration"
            label="Thời lượng (phút)"
            required
            error={form.formState.errors.estimatedDuration?.message}
          >
            <Input
              id="estimatedDuration"
              type="number"
              min={0}
              disabled={updateMutation.isPending}
              {...form.register("estimatedDuration", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        {/* Requirements */}
        <FormField
          htmlFor="requirements"
          label="Yêu cầu đầu vào"
          error={form.formState.errors.requirements?.message}
        >
          <Textarea
            id="requirements"
            rows={3}
            disabled={updateMutation.isPending}
            {...form.register("requirements")}
          />
        </FormField>

        {/* Learning outcomes */}
        <FormField
          htmlFor="learningOutcomes"
          label="Kết quả đạt được"
          error={form.formState.errors.learningOutcomes?.message}
        >
          <Textarea
            id="learningOutcomes"
            rows={3}
            disabled={updateMutation.isPending}
            {...form.register("learningOutcomes")}
          />
        </FormField>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={updateMutation.isPending}
          >
            Hủy
          </Button>
        </div>
      </form>

      {/* Curriculum (expand/collapse sections) */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Chương trình học</h2>
          <span className="text-sm text-muted-foreground">
            ({course.sections.length} phần)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setIsCreateSectionOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Thêm phần
          </Button>
        </div>
        <CourseSections
          courseId={courseId}
          sections={sections}
          busy={isReordering}
          onAddLesson={(sectionId) => {
            setCreateLessonSectionId(sectionId);
            setIsCreateLessonOpen(true);
          }}
          onMoveSection={handleMoveSection}
          onMoveLesson={handleMoveLesson}
          onDeleteSection={(sectionId) => {
            const target = sections.find((section) => section.id === sectionId);
            if (target) setDeleteSectionTarget(target);
          }}
          onAddAssessment={(sectionId) =>
            router.push(
              ROUTES.COURSE_ASSESSMENT_CREATE.replace(":courseId", courseId).replace(
                ":sectionId",
                sectionId,
              ),
            )
          }
        />
      </section>

      <CreateSectionModal
        courseId={courseId}
        open={isCreateSectionOpen}
        onOpenChange={setIsCreateSectionOpen}
      />

      <CreateLessonModal
        courseId={courseId}
        sectionId={createLessonSectionId ?? ""}
        open={isCreateLessonOpen}
        onOpenChange={setIsCreateLessonOpen}
      />

      {deleteSectionTarget && (
        <DeleteSectionModal
          courseId={courseId}
          section={deleteSectionTarget}
          open={!!deleteSectionTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteSectionTarget(null);
          }}
        />
      )}
    </div>
  );
}
