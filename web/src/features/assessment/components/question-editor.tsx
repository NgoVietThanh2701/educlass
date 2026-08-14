"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
import {
  addOption,
  createQuestion,
  deleteOption,
  updateOption,
  updateQuestion,
} from "../api/assessment";
import type { AssessmentQuestion, QuestionType } from "../types/assessment.type";

interface QuestionEditorProps {
  assessmentId: string;
  /** Existing question to edit, or `null` to create a new one. */
  question: AssessmentQuestion | null;
  onSaved: () => void;
  onCancel: () => void;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "SINGLE", label: "Một đáp án" },
  { value: "MULTIPLE", label: "Nhiều đáp án" },
];

interface OptionDraft {
  id?: string;
  content: string;
  isCorrect: boolean;
}

/**
 * Editor for a single question (content / type / score / explanation + its
 * options). A NEW question is created together with its options in one call; an
 * EXISTING question is patched and its options are synced (added/updated/removed).
 */
export default function QuestionEditor({
  assessmentId,
  question,
  onSaved,
  onCancel,
}: QuestionEditorProps) {
  const [content, setContent] = useState(question?.content ?? "");
  const [type, setType] = useState<QuestionType>(question?.type ?? "SINGLE");
  const [score, setScore] = useState<number>(question?.score ?? 1);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    question && question.options.length > 0
      ? question.options.map((o) => ({
          id: o.id,
          content: o.content,
          isCorrect: o.isCorrect,
        }))
      : [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
        ],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOptionAt = (index: number, patch: Partial<OptionDraft>) => {
    setOptions((prev) =>
      prev.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  };

  const removeOptionAt = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addOptionRow = () => {
    setOptions((prev) => [...prev, { content: "", isCorrect: false }]);
  };

  const handleSave = async () => {
    const trimmedContent = content.trim();
    const trimmedExplanation = explanation.trim() || undefined;
    const filledOptions = options.filter((option) => option.content.trim() !== "");

    if (!trimmedContent) {
      setError("Nội dung câu hỏi là bắt buộc.");
      return;
    }
    if (filledOptions.length < 2) {
      setError("Câu hỏi phải có ít nhất 2 lựa chọn có nội dung.");
      return;
    }
    const correctCount = filledOptions.filter((option) => option.isCorrect).length;
    if (type === "SINGLE" && correctCount !== 1) {
      setError("Câu hỏi một đáp án phải có đúng 1 đáp án đúng.");
      return;
    }
    if (type === "MULTIPLE" && correctCount < 1) {
      setError("Câu hỏi nhiều đáp án phải có ít nhất 1 đáp án đúng.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (!question) {
        await createQuestion(assessmentId, {
          content: trimmedContent,
          explanation: trimmedExplanation,
          score: score || 1,
          type,
          options: filledOptions.map((option) => ({
            content: option.content.trim(),
            isCorrect: option.isCorrect,
          })),
        });
      } else {
        await updateQuestion(assessmentId, question.id, {
          content: trimmedContent,
          explanation: trimmedExplanation,
          score: score || 1,
          type,
        });

        const keptIds = new Set(
          filledOptions.map((option) => option.id).filter(Boolean),
        );
        for (const option of question.options) {
          if (!keptIds.has(option.id)) {
            await deleteOption(assessmentId, question.id, option.id);
          }
        }
        for (const option of filledOptions) {
          if (option.id) {
            await updateOption(assessmentId, question.id, option.id, {
              content: option.content.trim(),
              isCorrect: option.isCorrect,
            });
          } else {
            await addOption(assessmentId, question.id, {
              content: option.content.trim(),
              isCorrect: option.isCorrect,
            });
          }
        }
      }
      onSaved();
      toast.success(question ? "Đã cập nhật câu hỏi." : "Đã thêm câu hỏi.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <FormRow label="Nội dung câu hỏi" required>
        <Textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..."
          disabled={busy}
        />
      </FormRow>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Loại câu hỏi">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            disabled={busy}
          >
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormRow>

        <FormRow label="Điểm">
          <Input
            type="number"
            min={0}
            step={1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            disabled={busy}
          />
        </FormRow>
      </div>

      <FormRow label="Giải thích (tùy chọn)">
        <Textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Lời giải thích hiển thị sau khi trả lời..."
          disabled={busy}
        />
      </FormRow>

      {/* Options */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lựa chọn (đánh dấu đáp án đúng)
        </p>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                checked={option.isCorrect}
                disabled={busy}
                onChange={(e) =>
                  updateOptionAt(index, { isCorrect: e.target.checked })
                }
              />
              <Input
                value={option.content}
                onChange={(e) =>
                  updateOptionAt(index, { content: e.target.value })
                }
                placeholder={`Lựa chọn ${index + 1}`}
                disabled={busy}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Xóa lựa chọn"
                disabled={busy || options.length <= 2}
                onClick={() => removeOptionAt(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 gap-1"
          onClick={addOptionRow}
          disabled={busy}
        >
          <Plus className="h-3 w-3" />
          Thêm lựa chọn
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4" />
          Hủy
        </Button>
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Lưu câu hỏi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/** Minimal labelled row to avoid repeating FormField imports. */
function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}