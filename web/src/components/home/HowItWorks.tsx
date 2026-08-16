import { Fragment } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import Container from "@/components/layout/public/Container";

interface Step {
  number: string;
  title: string;
  description: string;
  /** Optional English tag (Course / Lesson / Certificate). */
  tag?: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản miễn phí chỉ trong vài bước đơn giản.",
  },
  {
    number: "02",
    title: "Chọn khóa học",
    description:
      "Duyệt thư viện và chọn khóa học phù hợp với mục tiêu của bạn.",
    tag: "Course",
  },
  {
    number: "03",
    title: "Học bài",
    description:
      "Học lần lượt từng bài giảng, làm bài tập và bài đánh giá trực tiếp.",
    tag: "Lesson",
  },
  {
    number: "04",
    title: "Hoàn thành",
    description: "Kết thúc khóa học và nhận chứng chỉ ghi nhận thành quả.",
    tag: "Certificate",
  },
];

function StepCard({ step }: { step: Step }) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:w-auto lg:flex-1">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">
        {step.number}
      </span>

      <h3 className="font-heading text-base font-semibold text-foreground">
        {step.title}
      </h3>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>

      {step.tag ? (
        <div className="mt-1 break-words">
          <ArrowDown
            className="mx-auto mb-1 h-4 w-4 text-muted-foreground/50"
            aria-hidden
          />
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {step.tag}
          </span>
        </div>
      ) : (
        <div aria-hidden className="mt-1 h-8" />
      )}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="w-full border-t border-border/60 py-10 sm:py-12 md:py-14 lg:py-16">
      <Container>
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            EduClass hoạt động như thế nào?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Bắt đầu với EduClass chỉ với 4 bước đơn giản — từ đăng ký đến nhận
            chứng chỉ.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5 lg:flex-row lg:gap-2">
          {steps.map((step, index) => (
            <Fragment key={step.number}>
              <StepCard step={step} />

              {index < steps.length - 1 && (
                <ArrowRight
                  className="hidden h-6 w-6 shrink-0 rotate-90 text-primary/60 lg:block lg:rotate-0"
                  aria-hidden
                />
              )}
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  );
}
