import Container from "@/components/layout/public/Container";
import { cn } from "@/lib/utils";
import {
  Award,
  BookOpen,
  GraduationCap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClass: string;
}

const features: Feature[] = [
  {
    icon: GraduationCap,
    title: "Học mọi lúc, mọi nơi",
    description:
      "Học trực tuyến trên mọi thiết bị, bất kể thời gian hay địa điểm — chỉ cần có kết nối Internet là có thể bắt đầu.",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Nội dung chất lượng",
    description:
      "Giáo án, bài giảng và bài tập được các giáo viên biên soạn kỹ lưỡng, bám sát chương trình học.",
    iconClass: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: TrendingUp,
    title: "Theo dõi tiến độ",
    description:
      "Theo dõi tiến độ từng bài học và kết quả đánh giá, giúp bạn nắm rõ điểm mạnh, điểm yếu của mình.",
    iconClass: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Award,
    title: "Chứng chỉ hoàn thành",
    description:
      "Hoàn thành khóa học để nhận chứng chỉ, ghi nhận thành quả học tập của bạn một cách rõ ràng.",
    iconClass: "bg-teal-500/10 text-teal-600",
  },
];

export default function WhyEduClass() {
  return (
    <section className="w-full py-10 sm:py-12 md:py-14 lg:py-16">
      <Container>
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Vì sao chọn EduClass?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Nền tảng học trực tuyến được thiết kế để giúp cả giáo viên lẫn học
            sinh đạt được mục tiêu của mình.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, iconClass }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  iconClass,
                )}
              >
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
