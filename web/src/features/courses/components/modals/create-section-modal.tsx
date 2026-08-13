"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/error-message";
import { useCreateSection } from "../../hooks/use-create-section";
import {
  createSectionSchema,
  type CreateSectionFormValues,
} from "../../schemas/create-section.schema";

export interface CreateSectionModalProps {
  /** The course the new section belongs to. */
  courseId: string;
  /** Controlled open state (set to `true` to show, `false` to hide). */
  open: boolean;
  /** Called when the dialog requests to close (e.g. backdrop / Escape / Cancel). */
  onOpenChange: (open: boolean) => void;
  /** Called after a section is created successfully. */
  onSuccess?: () => void;
}

/**
 * Modal form to create a section under a course.
 *
 * Uses the generic `Dialog` primitives so the same `<Dialog>` /
 * `<DialogContent>` building blocks can be reused for future lesson /
 * assessment creation modals. Controlled via `open` + `onOpenChange` so the
 * parent decides what triggers it.
 */
export default function CreateSectionModal({
  courseId,
  open,
  onOpenChange,
  onSuccess,
}: CreateSectionModalProps) {
  const [error, setError] = useState<string | null>(null);

  const createSectionMutation = useCreateSection(courseId);

  const form = useForm<CreateSectionFormValues>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { title: "", description: "" },
  });

  const close = () => onOpenChange(false);

  const onSubmit = (values: CreateSectionFormValues) => {
    setError(null);
    createSectionMutation.mutate(
      {
        title: values.title,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          form.reset({ title: "", description: "" });
          close();
          onSuccess?.();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm phần học mới</DialogTitle>
          <DialogDescription>
            Tạo một phần học mới cho khóa học. Thứ tự sẽ tự động gán kế tiếp
            phần cuối.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            htmlFor="title"
            label="Tên phần học"
            required
            error={form.formState.errors.title?.message}
          >
            <Input
              id="title"
              placeholder="Ví dụ: Giới thiệu cơ bản"
              maxLength={200}
              disabled={createSectionMutation.isPending}
              {...form.register("title")}
            />
          </FormField>

          <FormField
            htmlFor="description"
            label="Mô tả phần học (tùy chọn)"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              placeholder="Mô tả ngắn về nội dung của phần học này"
              disabled={createSectionMutation.isPending}
              {...form.register("description")}
            />
          </FormField>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
            >
              {error}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={createSectionMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={createSectionMutation.isPending}
            onClick={(e) => {
              // Trigger the form submit from the footer.
              e.preventDefault();
              form.handleSubmit(onSubmit)();
            }}
          >
            {createSectionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Thêm phần"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
