"use client";

import { useEffect, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { COURSE_DETAIL_QUERY_KEY } from "@/features/courses/hooks/use-course-detail";
import {
  createAssessment,
  deleteQuestion,
  getAssessmentDetail,
  reorderQuestions,
  updateAssessment,
} from "../api/assessment";
import {
  type AssessmentInfoFormValues,
  assessmentInfoSchema,
} from "../schemas/assessment.schema";
import type {
  AssessmentDetail,
  AssessmentQuestion,
} from "../types/assessment.type";
import QuestionEditor from "./question-editor";

interface CreateAssessmentPageProps {
  courseId: string;
  sectionId: string;
  /** Present when EDITING an existing assessment (pre-fills the info form + questions). */
  assessmentId?: string;
}

/**
 * Where the teacher builds an assessment: info + questions (with options) + DnD
 * reorder. Works in two modes:
 *  - CREATE (no `assessmentId`): an empty info form creates the assessment, then
 *    questions can be added/reordered.
 *  - EDIT (`assessmentId`): the existing assessment is loaded and BOTH the info
 *    form (pre-filled, saved via PATCH) and the question editor are available.
 */
export default function CreateAssessmentPage({
  courseId,
  sectionId,
  assessmentId,
}: CreateAssessmentPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(assessmentId);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [editLoading, setEditLoading] = useState(isEdit);
  const [editingQuestionId, setEditingQuestionId] = useState<
    string | "new" | null
  >(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [reorderPending, setReorderPending] = useState(false);

  const form = useForm<AssessmentInfoFormValues>({
    resolver: zodResolver(assessmentInfoSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 30,
      shuffleQuestions: false,
      shuffleOptions: false,
    },
  });

  const goBack = () =>
    router.push(ROUTES.COURSE_EDIT.replace(":slug", courseId));

  // EDIT mode: load the assessment once, pre-fill the info form and seed the
  // question list from the server.
  useEffect(() => {
    if (!assessmentId) return;

    let cancelled = false;

    (async () => {
      try {
        const detail = await getAssessmentDetail(assessmentId);
        if (cancelled) return;

        setAssessment(detail);
        setQuestions(
          [...(detail.questions ?? [])].sort((a, b) => a.order - b.order),
        );
        form.reset({
          title: detail.title,
          description: detail.description ?? "",
          duration: detail.duration,
          shuffleQuestions: detail.shuffleQuestions,
          shuffleOptions: detail.shuffleOptions,
        });
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, form]);

  const handleSaveInfo = async (values: AssessmentInfoFormValues) => {
    setCreating(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        duration: values.duration,
        shuffleQuestions: values.shuffleQuestions,
        shuffleOptions: values.shuffleOptions,
      };

      if (assessment) {
        await updateAssessment(assessment.id, payload);
        await refresh();
        toast.success("Đã cập nhật đề kiểm tra.");
      } else {
        const created = await createAssessment({
          ...payload,
          sectionId,
        });
        setAssessment(created);
        setQuestions(
          [...(created.questions ?? [])].sort((a, b) => a.order - b.order),
        );
        toast.success("Đã tạo đề kiểm tra.");
      }

      // The course-edit page shows assessments inside the section tree after
      // navigating back — keep its cache in sync.
      queryClient.invalidateQueries({
        queryKey: [...COURSE_DETAIL_QUERY_KEY, courseId],
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const refresh = async () => {
    if (!assessment) return;
    const detail = await getAssessmentDetail(assessment.id);
    setAssessment(detail);
    setQuestions(
      [...(detail.questions ?? [])].sort((a, b) => a.order - b.order),
    );
  };

  const handleQuestionSaved = async () => {
    await refresh();
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!assessment) return;
    setDeletingQuestionId(questionId);
    try {
      await deleteQuestion(assessment.id, questionId);
      await refresh();
      toast.success("Đã xóa câu hỏi.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingQuestionId(null);
    }
  };

  /** Drag & drop reorder of the questions. */
  const handleMoveQuestion = (fromId: string, toId: string) => {
    const fromIndex = questions.findIndex((q) => q.id === fromId);
    if (fromIndex === -1) return;
    const from = questions[fromIndex];
    if (from.id === toId) return;

    const next = questions.filter((q) => q.id !== fromId);
    const insertAt = next.findIndex((q) => q.id === toId);
    if (insertAt === -1) return;
    next.splice(insertAt, 0, from);

    setQuestions(next);
    if (assessment) {
      setReorderPending(true);
      reorderQuestions(
        assessment.id,
        next.map((q) => q.id),
      )
        .catch((err) => {
          void refresh();
          toast.error(getErrorMessage(err));
        })
        .finally(() => setReorderPending(false));
    }
  };

  const handleDragStart = (e: DragEvent<HTMLSpanElement>, id: string) => {
    if (reorderPending) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragId(id);
    setOverId(id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (dragId && dragId !== id) {
      handleMoveQuestion(dragId, id);
    }
    setDragId(null);
    setOverId(null);
  };

  if (editLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 gap-1"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chỉnh sửa khóa học
        </Button>
        <h1 className="text-xl font-semibold">
          {isEdit ? "Chỉnh sửa đề kiểm tra" : "Tạo đề kiểm tra"}
        </h1>
      </div>

      {assessment ? (
        <>
          {/* EDIT mode: info form stays visible so metadata can be changed
              anytime; CREATE mode switches from the empty form to questions. */}
          {isEdit && (
            <form
              onSubmit={form.handleSubmit(handleSaveInfo)}
              className="space-y-4 rounded-lg border border-border p-5"
            >
              <FormField
                htmlFor="a-title"
                label="Tiêu đề"
                required
                error={form.formState.errors.title?.message}
              >
                <Input
                  id="a-title"
                  placeholder="Ví dụ: Đề kiểm tra giữa kỳ"
                  maxLength={255}
                  disabled={creating}
                  {...form.register("title")}
                />
              </FormField>

              <FormField
                htmlFor="a-description"
                label="Mô tả (tùy chọn)"
                error={form.formState.errors.description?.message}
              >
                <Textarea
                  id="a-description"
                  rows={3}
                  maxLength={2000}
                  placeholder="Mô tả đề kiểm tra..."
                  disabled={creating}
                  {...form.register("description")}
                />
              </FormField>

              <FormField
                htmlFor="a-duration"
                label="Thời gian làm bài (phút)"
                required
                error={form.formState.errors.duration?.message}
              >
                <Input
                  id="a-duration"
                  type="number"
                  min={1}
                  step={1}
                  disabled={creating}
                  {...form.register("duration", { valueAsNumber: true })}
                />
              </FormField>

              <div className="grid gap-2 sm:grid-cols-2">
                <FormField
                  htmlFor="a-shuffle-questions"
                  label="Xáo trộn câu hỏi"
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id="a-shuffle-questions"
                    disabled={creating}
                    checked={form.watch("shuffleQuestions")}
                    onChange={(e) =>
                      form.setValue("shuffleQuestions", e.target.checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                </FormField>
                <FormField
                  htmlFor="a-shuffle-options"
                  label="Xáo trộn lựa chọn"
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id="a-shuffle-options"
                    disabled={creating}
                    checked={form.watch("shuffleOptions")}
                    onChange={(e) =>
                      form.setValue("shuffleOptions", e.target.checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={creating}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Assessment summary */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{assessment.title}</h2>
              <span className="text-xs text-muted-foreground">
                {assessment.duration} phút · {assessment.questionCount} câu hỏi
                {assessment.shuffleQuestions && " · xáo trộn câu hỏi"}
              </span>
            </div>
            {assessment.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {assessment.description}
              </p>
            )}
          </div>

          {/* Questions */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Danh sách câu hỏi</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={editingQuestionId !== null}
                onClick={() => setEditingQuestionId("new")}
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </Button>
            </div>

            {reorderPending && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang lưu thứ tự câu hỏi…
              </div>
            )}

            {/* inline error removed — API errors shown via toast */}
            {questions.length === 0 && editingQuestionId === null ? (
              <p className="text-sm text-muted-foreground">
                Chưa có câu hỏi nào. Bấm “Thêm câu hỏi” để bắt đầu.
              </p>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className={cn(
                      "rounded-lg border border-border",
                      overId === question.id &&
                        "border-primary/60 ring-1 ring-primary/40",
                    )}
                    onDragOver={(e) => handleDragOver(e, question.id)}
                    onDrop={(e) => handleDrop(e, question.id)}
                  >
                    {editingQuestionId === question.id ? (
                      <QuestionEditor
                        assessmentId={assessment.id}
                        question={question}
                        onSaved={() => void handleQuestionSaved()}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    ) : (
                      <div className="group flex items-start gap-2 p-3">
                        <span
                          draggable={!reorderPending}
                          onDragStart={(e) => handleDragStart(e, question.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverId(null);
                          }}
                          className="mt-1 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                          title="Kéo để sắp xếp"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="truncate text-sm font-medium">
                              {question.order}. {question.content}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {question.type === "SINGLE"
                                ? "Một đáp án"
                                : "Nhiều đáp án"}{" "}
                              · {question.score}
                            </span>
                          </div>
                          <ul className="mt-1 flex flex-wrap gap-1.5">
                            {question.options.map((option) => (
                              <li
                                key={option.id}
                                className={cn(
                                  "rounded border px-1.5 py-0.5 text-xs",
                                  option.isCorrect
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground",
                                )}
                              >
                                {option.content}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Sửa câu hỏi"
                            disabled={editingQuestionId !== null}
                            onClick={() => setEditingQuestionId(question.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Xóa câu hỏi"
                            disabled={deletingQuestionId === question.id}
                            onClick={() =>
                              void handleDeleteQuestion(question.id)
                            }
                          >
                            {deletingQuestionId === question.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {editingQuestionId === "new" && (
                  <QuestionEditor
                    assessmentId={assessment.id}
                    question={null}
                    onSaved={() => void handleQuestionSaved()}
                    onCancel={() => setEditingQuestionId(null)}
                  />
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <form
          onSubmit={form.handleSubmit(handleSaveInfo)}
          className="space-y-4 rounded-lg border border-border p-5"
        >
          <FormField
            htmlFor="a-title"
            label="Tiêu đề"
            required
            error={form.formState.errors.title?.message}
          >
            <Input
              id="a-title"
              placeholder="Ví dụ: Đề kiểm tra giữa kỳ"
              maxLength={255}
              disabled={creating}
              {...form.register("title")}
            />
          </FormField>

          <FormField
            htmlFor="a-description"
            label="Mô tả (tùy chọn)"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="a-description"
              rows={3}
              maxLength={2000}
              placeholder="Mô tả đề kiểm tra..."
              disabled={creating}
              {...form.register("description")}
            />
          </FormField>

          <FormField
            htmlFor="a-duration"
            label="Thời gian làm bài (phút)"
            required
            error={form.formState.errors.duration?.message}
          >
            <Input
              id="a-duration"
              type="number"
              min={1}
              step={1}
              disabled={creating}
              {...form.register("duration", { valueAsNumber: true })}
            />
          </FormField>

          <div className="grid gap-2 sm:grid-cols-2">
            <FormField
              htmlFor="a-shuffle-questions"
              label="Xáo trộn câu hỏi"
              className="flex items-center gap-2"
            >
              <Checkbox
                id="a-shuffle-questions"
                disabled={creating}
                checked={form.watch("shuffleQuestions")}
                onChange={(e) =>
                  form.setValue("shuffleQuestions", e.target.checked, {
                    shouldValidate: true,
                  })
                }
              />
            </FormField>
            <FormField
              htmlFor="a-shuffle-options"
              label="Xáo trộn lựa chọn"
              className="flex items-center gap-2"
            >
              <Checkbox
                id="a-shuffle-options"
                disabled={creating}
                checked={form.watch("shuffleOptions")}
                onChange={(e) =>
                  form.setValue("shuffleOptions", e.target.checked, {
                    shouldValidate: true,
                  })
                }
              />
            </FormField>
          </div>

          {/* API errors shown via toast */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={creating}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo đề kiểm tra"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
