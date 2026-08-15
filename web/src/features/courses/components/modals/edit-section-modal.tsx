"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";

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
import { useUpdateSection } from "../../hooks/use-update-section";
import {
  createSectionSchema,
  type CreateSectionFormValues,
} from "../../schemas/create-section.schema";
import type { CourseDetailSection } from "../../types/course-detail.type";

interface EditSectionModalProps {
  /** The course the section belongs to. */
  courseId: string;
  /** The section being edited (used to pre-fill the form). */
  section: CourseDetailSection;
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog requests to close. */
  onOpenChange: (open: boolean) => void;
  /** Called after a section is updated successfully. */
  onSuccess?: () => void;
}

/**
 * Modal form to edit a section's metadata (title / description).
 *
 * Mounted with `key={section.id}` (see `course-sections.tsx` usage) so the form
 * is re-seeded with the correct values whenever a different section opens.
 */
export default function EditSectionModal({
  courseId,
  section,
  open,
  onOpenChange,
  onSuccess,
}: EditSectionModalProps) {
  const updateSectionMutation = useUpdateSection(courseId, section.id);
  const isPending = updateSectionMutation.isPending;

  const form = useForm<CreateSectionFormValues>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      title: section.title ?? "",
      description: section.description ?? "",
    },
  });

  const close = () => onOpenChange(false);

  const onSubmit = (values: CreateSectionFormValues) => {
    updateSectionMutation.mutate(
      {
        title: values.title,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          close();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa phần học</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin của phần {section.order}: {section.title}.
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
              disabled={isPending}
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
              disabled={isPending}
              {...form.register("description")}
            />
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
            disabled={isPending}
            onClick={(e) => {
              // Trigger the form submit from the footer.
              e.preventDefault();
              void form.handleSubmit(onSubmit)();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
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