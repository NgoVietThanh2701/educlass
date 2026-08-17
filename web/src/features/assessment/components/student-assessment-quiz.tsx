"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  PlayCircle,
  Timer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-message";
import { ASSESSMENT_STATUS_CONFIG } from "@/features/courses/constants/course";
import type { StudentCourseAssessment } from "@/features/courses/types/student-course.type";
import {
  getStudentAssessmentQuiz,
  startAttempt,
  submitAttempt,
  syncAttemptAnswers,
} from "../api/assessment-attempt";
import type {
  AssessmentQuiz,
  Attempt,
  QuizQuestion,
} from "../types/attempt.type";

const PAGE_SIZE = 4;

type Phase = "intro" | "loading" | "active" | "result";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Map questionId → selected optionIds. */
type AnswersState = Record<string, string[]>;

interface AssessmentResultReviewProps {
  quiz: AssessmentQuiz | null;
  result: Attempt;
}

/**
 * Per-question review shown after submit/timeout. Uses the full question set
 * (options content) from `quiz` merged with the scored `result.questionResults`
 * (which carries correctness + the correct option ids — the answer key is only
 * exposed AFTER scoring, never in the live quiz payload).
 */
function AssessmentResultReview({ quiz, result }: AssessmentResultReviewProps) {
  const questionResults = result.questionResults ?? [];
  if (!quiz || questionResults.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu chi tiết câu trả lời.
      </p>
    );
  }

  const qrByQuestion = new Map(
    questionResults.map((qr) => [qr.questionId, qr] as const),
  );
  const selectedByQuestion = new Map<string, string[]>();
  for (const a of result.answers) {
    const cur = selectedByQuestion.get(a.questionId) ?? [];
    cur.push(a.optionId);
    selectedByQuestion.set(a.questionId, cur);
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Chi tiết từng câu
      </h3>
      {quiz.questions.map((question, index) => {
        const qr = qrByQuestion.get(question.id) ?? {
          questionId: question.id,
          correct: false,
          correctOptionIds: [],
        };
        const selectedIds = new Set(selectedByQuestion.get(question.id) ?? []);
        const correctIds = new Set(qr.correctOptionIds);
        const isSingle = question.type === "SINGLE";

        return (
          <section
            key={question.id}
            className="rounded-lg border border-border p-4"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm">
                <span className="font-medium text-muted-foreground">
                  Câu {index + 1}:
                </span>{" "}
                {question.content}
              </p>
              <Badge variant={qr.correct ? "default" : "destructive"}>
                {qr.correct ? "Đúng" : "Sai"}
              </Badge>
            </div>

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const optionIsCorrect = correctIds.has(option.id);
                const optionIsSelected = selectedIds.has(option.id);
                const variant: "correct" | "wrong" | "neutral" = optionIsCorrect
                  ? "correct"
                  : optionIsSelected
                    ? "wrong"
                    : "neutral";
                const labelCls =
                  variant === "correct"
                    ? "border-green-200 bg-green-50"
                    : variant === "wrong"
                      ? "border-red-200 bg-red-50"
                      : "border-border";

                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${labelCls}`}
                  >
                    <input
                      type={isSingle ? "radio" : "checkbox"}
                      checked={optionIsSelected}
                      readOnly
                      className="mt-0.5 h-4 w-4 accent-transparent"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mr-1.5 font-medium text-muted-foreground">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option.content}
                    </span>
                    {variant === "correct" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {variant === "wrong" && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}

interface StudentAssessmentQuizProps {
  courseId: string;
  assessment: StudentCourseAssessment;
}

/**
 * Inline quiz-taking UI rendered inside the learning player (same shell as
 * lessons). Phases:
 *  1. INTRO   — assessment info + "Bắt đầu" button.
 *  2. ACTIVE  — full question list fetched once, paginated client-side at
 *     `PAGE_SIZE` per page; countdown timer from the attempt `deadlineAt`;
 *     answers buffered in client state and flushed once via
 *     `syncAttemptAnswers` at submit (manual or on timeout); question
 *     navigator chips mark answered questions.
 *  3. RESULT  — score + pass/fail returned by the backend after submit.
 */
export function StudentAssessmentQuiz({
  courseId,
  assessment,
}: StudentAssessmentQuizProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<AssessmentQuiz | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<Attempt | null>(null);

  // Guard against synchronous double-invocation inside the async handler.
  // NOTE: refs do NOT trigger re-renders, so the *UI* state (button disabled
  // + label) must be driven by `isSubmitting` below — using `submittingRef.current`
  // directly in JSX leaves the button stuck enabled (double-submit risk).
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard against the auto-submit effect firing repeatedly while
  // `remainingMs` stays at 0 across renders (once auto-submitted per attempt).
  const didAutoSubmit = useRef(false);

  // ===================== START =====================
  const handleStart = async () => {
    setPhase("loading");
    try {
      // Kick off attempt + fetch the full question set in parallel.
      const [attemptResult, quizResult] = await Promise.all([
        startAttempt(assessment.id),
        getStudentAssessmentQuiz(courseId, assessment.id),
      ]);
      setAttempt(attemptResult);
      setQuiz(quizResult);
      setAnswers({});
      setPage(0);
      setResult(null);
      didAutoSubmit.current = false;
      setPhase("active");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setPhase("intro");
    }
  };

  // ===================== TIMER =====================
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const deadlineMs = attempt ? Date.parse(attempt.deadlineAt) : NaN;
  const remainingMs =
    phase === "active" && Number.isFinite(deadlineMs)
      ? Math.max(0, deadlineMs - now)
      : 0;

  // --- Save strategy ---
  // Answers live ONLY in client state during the attempt. We intentionally do
  // NOT call `syncAttemptAnswers` on every answer change: the backend stores
  // `StudentAnswer` keyed by the composite PK [attemptId, optionId] inside a
  // single deleteMany + createMany transaction, so overlapped autosave
  // requests (autosave debounce firing concurrently with the submit/timeout)
  // raise Prisma P2002 unique conflicts. Instead we flush once, via
  // `handleSubmit`, right before `submitAttempt` computes the score.
  // (Auto-save may be re-added later as a non-overlapping single upsert.)

  // ===================== SUBMIT =====================
  const handleSubmit = useCallback(
    async (auto: boolean) => {
      if (!attempt || submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      try {
        // Flush any pending answers before submitting.
        const answered = Object.entries(answers)
          .filter(([, ids]) => ids.length > 0)
          .map(([questionId, optionIds]) => ({ questionId, optionIds }));
        if (answered.length > 0) {
          await syncAttemptAnswers(attempt.id, answered);
        }
        const finished = await submitAttempt(attempt.id);
        setResult(finished);
        setPhase("result");
      } catch (error) {
        toast.error(
          auto
            ? "Đã hết giờ, tự động nộp bài thất bại."
            : getErrorMessage(error),
        );
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [attempt, answers],
  );

  // Auto-submit when the countdown hits zero.
  // State updates are scheduled on the NEXT tick (setTimeout 0) so they do NOT
  // run synchronously inside this effect, which would trigger React's
  // "Calling setState synchronously within an effect can trigger cascading
  // renders" warning/error (React 19 / Next 15).
  useEffect(() => {
    if (
      phase === "active" &&
      remainingMs <= 0 &&
      attempt &&
      !didAutoSubmit.current
    ) {
      didAutoSubmit.current = true;
      const timerId = setTimeout(() => {
        void handleSubmit(true);
      }, 0);
      return () => clearTimeout(timerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, phase, attempt]);

  // ===================== ANSWER HANDLERS =====================
  const toggleOption = (question: QuizQuestion, optionId: string) => {
    setAnswers((prev) => {
      if (question.type === "SINGLE") {
        return { ...prev, [question.id]: [optionId] };
      }
      const current = prev[question.id] ?? [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [question.id]: next };
    });
  };

  const totalPages = quiz
    ? Math.max(1, Math.ceil(quiz.questions.length / PAGE_SIZE))
    : 1;
  const pageQuestions = quiz
    ? quiz.questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : [];
  const answeredCount = Object.values(answers).filter(
    (ids) => ids.length > 0,
  ).length;
  // ===================== RENDER =====================
  // -- INTRO --
  if (phase === "intro" || phase === "loading") {
    return (
      <article className="mx-auto max-w-xl space-y-5">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">
            Bài kiểm tra: {assessment.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {ASSESSMENT_STATUS_CONFIG[assessment.status].label}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {assessment.duration} phút
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Copy className="h-3.5 w-3.5" />
              {assessment.questionCount ?? 0} câu hỏi
            </span>
          </div>
        </header>

        {assessment.description && (
          <p className="text-sm text-muted-foreground">
            {assessment.description}
          </p>
        )}

        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Trước khi bắt đầu</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Bài thi có thời gian {assessment.duration} phút — đồng hồ đếm
              ngược sẽ tự nộp bài khi hết giờ.
            </li>
            <li>
              Mỗi trang hiển thị tối đa {PAGE_SIZE} câu hỏi; câu cho phép chọn
              nhiều đáp án sẽ hiển thị dạng checkbox.
            </li>
            <li>
              Câu nào đã chọn sẽ được đánh dấu ở mục lục câu hỏi bên phải.
            </li>
          </ul>
        </div>

        <Button
          className="w-full gap-1.5"
          disabled={phase === "loading"}
          onClick={() => void handleStart()}
        >
          {phase === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
          {phase === "loading" ? "Đang tạo bài thi…" : "Bắt đầu làm bài"}
        </Button>
      </article>
    );
  }

  // -- RESULT --
  if (phase === "result" && result) {
    const passed = result.passed ?? false;
    const score = result.score ?? 0;
    const correctCount = (result.questionResults ?? []).filter(
      (q) => q.correct,
    ).length;
    const totalQuestions = quiz
      ? quiz.questions.length
      : (result.questionResults?.length ?? 0);

    return (
      <article className="mx-auto max-w-3xl space-y-6">
        <div
          className={`rounded-lg border p-6 text-center ${
            passed
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <CheckCircle2
            className={`mx-auto mb-2 h-10 w-10 ${
              passed ? "text-green-600" : "text-amber-600"
            }`}
          />
          <h2 className="text-xl font-semibold">
            {passed ? "Chúc mừng, bạn đã đạt!" : "Chưa đạt, hãy cố gắng hơn!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Điểm số:{" "}
            <span className="text-lg font-bold text-foreground">{score}</span> —
            Đúng <span className="font-bold">{correctCount}</span>/
            {totalQuestions} câu
          </p>
        </div>

        <AssessmentResultReview quiz={quiz} result={result} />

        <Button
          variant="outline"
          className="w-full"
          onClick={() => void handleStart()}
        >
          <PlayCircle className="h-4 w-4" />
          Làm lại bài thi
        </Button>
      </article>
    );
  }
  // -- ACTIVE --
  if (!quiz || !attempt) return null;

  return (
    <div className="space-y-4">
      {/* Header: title + timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{quiz.title}</h2>
          <p className="text-xs text-muted-foreground">
            Đã trả lời {answeredCount}/{quiz.questions.length} câu
          </p>
        </div>
        <Badge
          variant={remainingMs > 60_000 ? "secondary" : "destructive"}
          className="gap-1.5 tabular-nums"
        >
          <Timer className="h-3.5 w-3.5" />
          {formatCountdown(Math.ceil(remainingMs / 1000))}
        </Badge>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Question index */}
        <aside className="shrink-0 lg:w-28">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mục lục câu hỏi
          </p>
          <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-2">
            {quiz.questions.map((q, index) => {
              const answered = (answers[q.id] ?? []).length > 0;
              const isCurrent = pageQuestions.some((pq) => pq.id === q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setPage(Math.floor(index / PAGE_SIZE))}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                    answered
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  aria-label={`Câu ${index + 1}${answered ? " (đã trả lời)" : ""}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Questions (4 per page) */}
        <div className="min-w-0 flex-1 space-y-4">
          {pageQuestions.map((question, index) => {
            const absoluteIndex = page * PAGE_SIZE + index;
            const selected = answers[question.id] ?? [];
            return (
              <section
                key={question.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">
                      Câu {absoluteIndex + 1}:
                    </span>
                    {question.content}
                  </p>
                  <Badge variant="outline" className="shrink-0">
                    {question.type === "SINGLE" ? "Chọn 1" : "Chọn nhiều"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, optionIndex) => {
                    const checked = selected.includes(option.id);
                    const inputId = `${question.id}-${option.id}`;
                    const sharedInputProps = {
                      id: inputId,
                      checked,
                      onChange: () => toggleOption(question, option.id),
                      className: "h-4 w-4 cursor-pointer accent-primary",
                    };
                    return (
                      <label
                        key={option.id}
                        htmlFor={inputId}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {question.type === "SINGLE" ? (
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            {...sharedInputProps}
                          />
                        ) : (
                          <input type="checkbox" {...sharedInputProps} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="mr-1.5 font-medium text-muted-foreground">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option.content}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Pagination + submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trang trước
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Trang sau
            </Button>

            <Button
              size="sm"
              className="ml-auto"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(false)}
            >
              {isSubmitting ? "Đang nộp bài…" : "Nộp bài"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
