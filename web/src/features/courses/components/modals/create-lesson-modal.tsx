"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Upload, X } from "lucide-react";

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
import { toast } from "sonner";
import {
  type CreateLessonFormValues,
  LESSON_TYPE_OPTIONS,
  LESSON_UNLOCK_RULE_OPTIONS,
  createLessonSchema,
} from "../../schemas/create-lesson.schema";
import { useCreateLesson } from "../../hooks/use-create-lesson";
import { getVideoDurationSeconds } from "../../utils/video";

export interface CreateLessonModalProps {
  courseId: string;
  /** Section the new lesson will belong to. */
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the lesson (and its video) is fully saved. */
  onSuccess?: () => void;
}

/**
 * Modal form to create a lesson under a section.
 *
 * Fields mirror `CreateLessonDto` (minus `order`, which the backend assigns).
 * The lesson **video** is processed on the frontend: after the lesson is
 * created, the selected video file is uploaded, its duration is read from the
 * browser, and both are attached to the lesson content — so the JSON lesson
 * endpoint stays free of multipart concerns.
 */
export default function CreateLessonModal({
  courseId,
  sectionId,
  open,
  onOpenChange,
  onSuccess,
}: CreateLessonModalProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createLessonMutation = useCreateLesson({ courseId, sectionId });
  const isPending = createLessonMutation.isPending;

  const form = useForm<CreateLessonFormValues>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "TEXT",
      durationSeconds: undefined,
      isPreview: false,
      unlockRule: "FREE",
    },
  });

  const watchedType = form.watch("type");
  const watchedIsPreview = form.watch("isPreview");

  const close = () => onOpenChange(false);

    const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(file ? URL.createObjectURL(file) : null);
    setVideoFile(file);

    // Auto-detect the video duration and pre-fill the form so the teacher
    // doesn't have to read it manually (still editable afterwards).
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
    if (!sectionId) {
      toast.error("Vui lòng chọn một phần để thêm bài học.");
      return;
    }

    createLessonMutation.mutate(
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
        onUploadProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          setUploadProgress(null);
          form.reset({
            title: "",
            description: "",
            type: "TEXT",
            durationSeconds: undefined,
            isPreview: false,
            unlockRule: "FREE",
          });
          clearVideo();
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
          <DialogTitle>Thêm bài học mới</DialogTitle>
          <DialogDescription>
            Tạo một bài học mới cho phần này. Thứ tự sẽ tự động gán kế tiếp
            bài cuối cùng.
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
              rows={3}
              maxLength={1000}
              placeholder="Mô tả ngắn về nội dung bài học..."
              disabled={isPending}
              {...form.register("description")}
            />
          </FormField>


          {/* Video (processed at the frontend) — only for VIDEO lessons */}
          {watchedType === "VIDEO" && (
            <FormField
              htmlFor="video"
              label="Video bài học"
              error={form.formState.errors.durationSeconds?.message}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="video"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Chọn video
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {videoFile ? videoFile.name : "Chưa có video"}
                  </span>
                </div>

                {videoPreview && (
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border bg-muted">
                    <video
                      src={videoPreview}
                      className="h-full w-full object-cover"
                      controls
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 text-destructive"
                      disabled={isPending}
                      onClick={clearVideo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đang tải video lên CDN… {uploadProgress}%
                  </p>
                </div>
              )}

                {videoFile && (
                <FormField
                  htmlFor="durationSeconds"
                  label="Thời lượng (giây)"
                  error={form.formState.errors.durationSeconds?.message}
                >
                  <div className="flex flex-col gap-1">
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
                      Đã lấy tự động từ video — có thể chỉnh sửa.
                    </p>
                  </div>
                </FormField>
              )}
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
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isPending || !sectionId}
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
                  : "Đang tạo..."}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Thêm bài học
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

