"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCloudinaryVideoUrl } from "@/lib/cloudinary";
import {
  type CreateLessonFormValues,
  LESSON_TYPE_OPTIONS,
  LESSON_UNLOCK_RULE_OPTIONS,
  createLessonSchema,
} from "../../schemas/create-lesson.schema";
import { useUpdateLesson } from "../../hooks/use-update-lesson";
import { getVideoDurationSeconds } from "../../utils/video";
import type { CourseDetailLesson } from "../../types/course-detail.type";

interface EditLessonModalProps {
  courseId: string;
  sectionId: string;
  lesson: CourseDetailLesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Modal to edit an existing lesson: its metadata (title, type, flags…) and its
 * content. For VIDEO lessons a new file can replace the current video; for TEXT
 * lessons the article body is edited. The metadata is patched first, then the
 * content is upserted to match the chosen type (see `use-update-lesson`).
 *
 * Mounted with `key={lesson.id}` so the form is freshly seeded per lesson.
 */
export default function EditLessonModal({
  courseId,
  sectionId,
  lesson,
  open,
  onOpenChange,
  onSuccess,
}: EditLessonModalProps) {
  const [textContent, setTextContent] = useState(lesson.content?.textContent ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateLessonMutation = useUpdateLesson({
    courseId,
    sectionId,
    lessonId: lesson.id,
  });
  const isPending = updateLessonMutation.isPending;

  const form = useForm<CreateLessonFormValues>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: lesson.title || "",
      description: lesson.description ?? "",
      type: lesson.type,
      durationSeconds: lesson.durationSeconds ?? undefined,
      isPreview: lesson.isPreview,
      unlockRule: lesson.unlockRule,
    },
  });

  const watchedType = form.watch("type");
  const watchedIsPreview = form.watch("isPreview");

  const existingVideoUrl = lesson.content?.objectKey
    ? getCloudinaryVideoUrl(lesson.content.objectKey)
    : null;

  const close = () => onOpenChange(false);

  // When the teacher switches the lesson to TEXT, drop any picked video file.
  useEffect(() => {
    if (watchedType !== "VIDEO" && (videoFile || videoPreview)) {
      clearVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedType]);

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(file ? URL.createObjectURL(file) : null);
    setVideoFile(file);

    // Auto-detect the new video duration and pre-fill the form field.
    if (file) {
      const duration = Math.round(await getVideoDurationSeconds(file));
      form.setValue(
        "durationSeconds",
        duration > 0 ? duration : undefined,
        { shouldValidate: true, shouldDirty: true },
      );
    } else {
      form.setValue("durationSeconds", undefined, { shouldValidate: true });
    }
  };

  const clearVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setVideoFile(null);
    form.setValue("durationSeconds", undefined, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: CreateLessonFormValues) => {
    updateLessonMutation.mutate(
      {
        data: {
          title: values.title,
          description: values.description || undefined,
          type: values.type,
          durationSeconds: values.durationSeconds,
          isPreview: values.isPreview,
          unlockRule: values.unlockRule,
        },
        video: videoFile,
        textContent,
        onUploadProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          setUploadProgress(null);
          close();
          onSuccess?.();
        },
        onError: () => {
          setUploadProgress(null);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa bài học</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và nội dung của bài {lesson.order}. {lesson.title}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <FormField
            htmlFor="title"
            label="Tên bài học"
            required
            error={form.formState.errors.title?.message}
          >
            <Input
              id="title"
              placeholder="Ví dụ: Giới thiệu khái niệm"
              maxLength={200}
              disabled={isPending}
              {...form.register("title")}
            />
          </FormField>

          {/* Lesson type */}
          <FormField
            htmlFor="type"
            label="Loại bài học"
            error={form.formState.errors.type?.message}
          >
            <Select
              id="type"
              value={watchedType}
              onChange={(e) =>
                form.setValue(
                  "type",
                  e.target.value as (typeof LESSON_TYPE_OPTIONS)[number]["value"],
                  { shouldValidate: true },
                )
              }
              disabled={isPending}
            >
              {LESSON_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Description */}
          <FormField
            htmlFor="description"
            label="Mô tả (tùy chọn)"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              rows={2}
              maxLength={1000}
              placeholder="Mô tả ngắn về nội dung bài học..."
              disabled={isPending}
              {...form.register("description")}
            />
          </FormField>

          {/* VIDEO content: replace-existing file or keep it */}
          {watchedType === "VIDEO" && (
            <FormField htmlFor="video" label="Video bài học" className="flex">
              <div className="space-y-3">
                {(videoPreview || existingVideoUrl) && (
                  <video
                    controls
                    className="w-full rounded-md border border-border bg-black"
                    src={videoPreview ?? existingVideoUrl ?? ""}
                  />
                )}

                {(videoPreview || existingVideoUrl) && (
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      <Upload className="h-4 w-4" />
                      {videoPreview ? "Thay video khác" : "Thay video"}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        onChange={handleVideoChange}
                        disabled={isPending}
                      />
                    </label>
                    {videoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearVideo}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        Gỡ video mới
                      </Button>
                    )}
                  </div>
                )}

                {!videoPreview && !existingVideoUrl && (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
                    <Upload className="h-5 w-5" />
                    <span>Chọn video cho bài học</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={handleVideoChange}
                      disabled={isPending}
                    />
                  </label>
                )}
              </div>
            </FormField>
          )}

          {/* VIDEO duration */}
          {watchedType === "VIDEO" && (
            <FormField
              htmlFor="durationSeconds"
              label="Thời lượng (giây)"
              error={form.formState.errors.durationSeconds?.message}
            >
              <Input
                id="durationSeconds"
                type="number"
                min={0}
                step={1}
                placeholder="Ví dụ: 360"
                disabled={isPending}
                {...form.register("durationSeconds", {
                  setValueAs: (v: unknown) =>
                    v === "" || v === undefined || v === null
                      ? undefined
                      : Number(v),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Tự lấy từ video khi chọn file — có thể chỉnh sửa.
              </p>
            </FormField>
          )}

          {/* TEXT content */}
          {watchedType === "TEXT" && (
            <FormField htmlFor="textContent" label="Nội dung bài viết">
              <Textarea
                id="textContent"
                rows={8}
                maxLength={20000}
                placeholder="Viết nội dung bài học tại đây..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isPending}
              />
            </FormField>
          )}

          {/* Preview toggle */}
          <FormField
            htmlFor="isPreview"
            label="Bài học được xem thử"
            className="flex items-center gap-2"
          >
            <Checkbox
              id="isPreview"
              checked={watchedIsPreview}
              onChange={(e) =>
                form.setValue("isPreview", e.target.checked, {
                  shouldValidate: true,
                })
              }
              disabled={isPending}
            />
          </FormField>

          {/* Unlock rule */}
          <FormField
            htmlFor="unlockRule"
            label="Quy tắc mở khóa"
            error={form.formState.errors.unlockRule?.message}
          >
            <Select
              id="unlockRule"
              value={form.watch("unlockRule")}
              onChange={(e) =>
                form.setValue(
                  "unlockRule",
                  e.target.value as (typeof LESSON_UNLOCK_RULE_OPTIONS)[number]["value"],
                  { shouldValidate: true },
                )
              }
              disabled={isPending}
            >
              {LESSON_UNLOCK_RULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress !== null
                  ? `Đang tải video ${uploadProgress}%...`
                  : "Đang lưu..."}
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}