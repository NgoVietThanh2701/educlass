import { Star } from "lucide-react";

import Container from "@/components/layout/public/Container";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatarClass: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Nguyễn Văn A",
    role: "Học viên",
    quote:
      "Nội dung rất dễ hiểu, tôi có thể học mọi lúc mọi nơi mà không bị gián đoạn. Bài giảng được sắp xếp logic và rõ ràng.",
    avatarClass: "bg-primary/10 text-primary",
  },
  {
    name: "Trần Thị B",
    role: "Học viên",
    quote:
      "Hệ thống theo dõi tiến độ giúp tôi biết chính xác mình đã hoàn thành những phần nào và cần cải thiện ở đâu.",
    avatarClass: "bg-amber-500/10 text-amber-600",
  },
  {
    name: "Lê Văn C",
    role: "Học viên",
    quote:
      "Nhận chứng chỉ sau khi hoàn thành khóa học là động lực rất lớn. Tôi sẽ tiếp tục học thêm nhiều khóa khác tại EduClass.",
    avatarClass: "bg-emerald-500/10 text-emerald-600",
  },
];

function Stars() {
  return (
    <div
      className="flex items-center gap-1 text-amber-400"
      role="img"
      aria-label="Đánh giá 5/5 sao"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="w-full border-t border-border/60 bg-muted/30 py-10 sm:py-12 md:py-14 lg:py-16">
      <Container>
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Học viên nói gì về EduClass?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Hàng nghìn học viên đã tin tưởng lựa chọn EduClass để phát triển
            kiến thức của mình.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(({ name, role, quote, avatarClass }) => (
            <figure
              key={name}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Stars />

              <blockquote className="flex-1 border-l-4 border-primary pl-4 text-sm leading-relaxed text-foreground/90">
                “{quote}”
              </blockquote>

              <figcaption className="mt-2 flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                    avatarClass,
                  )}
                >
                  {name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
