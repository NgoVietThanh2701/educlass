"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { RoleUser } from "@/types/role.type";
import { useCreateCourse } from "../hooks/use-create-course";
import {
  CreateCourseFormValues,
  createCourseSchema,
  LEVEL_OPTIONS,
} from "../schemas/create-course.schema";
import { LANGUAGES } from "../types/create-course.type";

export default function CreateCourseForm() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const createCourseMutation = useCreateCourse();

  const [error, setError] = useState<string | null>(null);
  const [thumbnailMeta, setThumbnailMeta] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Revoke any object URL we created to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (thumbnailMeta) {
        URL.revokeObjectURL(thumbnailMeta.previewUrl);
      }
    };
  }, [thumbnailMeta]);

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (thumbnailMeta) {
      URL.revokeObjectURL(thumbnailMeta.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setThumbnailMeta({ file, previewUrl });
  };

  const clearThumbnail = () => {
    if (thumbnailMeta) {
      URL.revokeObjectURL(thumbnailMeta.previewUrl);
    }
    setThumbnailMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: CreateCourseFormValues) => {
    setError(null);

    createCourseMutation.mutate(
      {
        data: {
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
        thumbnail: thumbnailMeta?.file ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Tạo khóa học thành công!");
          router.push(ROUTES.COURSE);
        },
        onError: (err) => {
          const apiError = err as {
            response?: { data?: { message?: string } };
          };
          setError(
            apiError?.response?.data?.message ??
              "Đã có lỗi xảy ra. Vui lòng thử lại.",
          );
        },
      },
    );
  };

  // Guard: only TEACHER can create a course.
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
        <p className="text-sm text-destructive">
          Bạn không có quyền tạo khóa học.
        </p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tạo khóa học mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Điền thông tin cơ bản của khóa học. Bạn có thể bổ sung chương trình
          học (sections, lessons) sau khi tạo.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-6"
      >
        {/* Title */}
        <FormField
          htmlFor="title"
          label="Tên khóa học"
          required
          error={form.formState.errors.title?.message}
        >
          <Input
            id="title"
            placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao"
            maxLength={200}
            disabled={createCourseMutation.isPending}
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
            placeholder="Một câu giới thiệu ngắn gọn hiển thị trên danh sách khóa học"
            maxLength={500}
            disabled={createCourseMutation.isPending}
            {...form.register("shortDescription")}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {form.watch("shortDescription")?.length ?? 0}/500
          </p>
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
            placeholder="Mô tả chi tiết nội dung, mục tiêu và lợi ích của khóa học"
            rows={5}
            disabled={createCourseMutation.isPending}
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
            <Select id="level" disabled={createCourseMutation.isPending} {...form.register("level")}>
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
            <Select id="language" disabled={createCourseMutation.isPending} {...form.register("language")}>
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
              disabled={createCourseMutation.isPending}
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
              disabled={createCourseMutation.isPending}
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
            placeholder="Kiến thức / kỹ năng cần có trước khi học (một yêu cầu mỗi dòng)"
            disabled={createCourseMutation.isPending}
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
            placeholder="Những gì học viên đạt được sau khóa học (một kết quả mỗi dòng)"
            disabled={createCourseMutation.isPending}
            {...form.register("learningOutcomes")}
          />
        </FormField>

        {/* Thumbnail */}
        <FormField htmlFor="thumbnail" label="Ảnh đại diện">
          <div className="flex items-start gap-4">
            <div className="flex h-36 w-56 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {thumbnailMeta ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailMeta.previewUrl}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                id="thumbnail"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={createCourseMutation.isPending}
              >
                {thumbnailMeta ? "Đổi ảnh" : "Chọn ảnh"}
              </Button>
              {thumbnailMeta && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearThumbnail}
                  className="text-destructive"
                >
                  <X className="mr-1 h-4 w-4" />
                  Xóa ảnh
                </Button>
              )}
            </div>
          </div>
        </FormField>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={createCourseMutation.isPending}>
            {createCourseMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo khóa học"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.COURSE)}
            disabled={createCourseMutation.isPending}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}