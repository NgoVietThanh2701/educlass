"use client";

import { useEffect, useDeferredValue, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";

import Container from "@/components/layout/public/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePublicCourses } from "@/features/courses/hooks/use-courses";
import type { PublicCoursesParams } from "@/features/courses/api/courses";
import {
  COURSE_CATEGORIES,
  COURSE_LEVEL,
} from "@/features/courses/types/course.type";
import type {
  CourseCategory,
  CourseLevel,
} from "@/features/courses/types/course.type";
import { CATEGORY_OPTIONS } from "@/features/courses/schemas/create-course.schema";
import { cn } from "@/lib/utils";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "@/components/home/public-course-card";

const PAGE_SIZE = 8;

/** `sortBy|order` joined value for the sort Select. */
const SORT_OPTIONS = [
  { value: "publishedAt|desc", label: "Mới nhất" },
  { value: "price|asc", label: "Giá thấp → cao" },
  { value: "price|desc", label: "Giá cao → thấp" },
  { value: "title|asc", label: "Tên A → Z" },
];

const PRICE_FILTER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "free", label: "Miễn phí" },
  { value: "paid", label: "Trả phí" },
];

const LEVEL_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

/** Compact, human-friendly page list: numbers + `"..."` ellipsis where there are gaps. */
function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= 1) return [1];

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const arr = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: (number | "...")[] = [];
  arr.forEach((p, i) => {
    if (i > 0 && p - arr[i - 1] > 1) out.push("...");
    out.push(p);
  });
  return out;
}

const SORT_BY_VALUES = ["publishedAt", "price", "title", "createdAt"] as const;
const ORDER_VALUES = ["asc", "desc"] as const;

/** Parse + whitelist the query string coming from the URL into typed filters. */
function parseSearchParams(query: string) {
  const p = new URLSearchParams(query);

  const category = p.get("category");
  const level = p.get("level");
  const price = p.get("price");
  const search = p.get("search");

  let sortBy = p.get("sortBy");
  let order = p.get("order");
  if (!SORT_BY_VALUES.includes(sortBy as (typeof SORT_BY_VALUES)[number])) {
    sortBy = "publishedAt";
  }
  if (!ORDER_VALUES.includes(order as (typeof ORDER_VALUES)[number])) {
    order = "desc";
  }

  const page = Math.max(1, Number(p.get("page") ?? "1") || 1);

  const priceVal: "" | "free" | "paid" =
    price === "free" || price === "paid" ? price : "";

  const catVal: CourseCategory | "" =
    category && COURSE_CATEGORIES.includes(category as CourseCategory)
      ? (category as CourseCategory)
      : "";

  const levelVal: CourseLevel | "" =
    level && COURSE_LEVEL.includes(level as CourseLevel)
      ? (level as CourseLevel)
      : "";

  return {
    category: catVal,
    level: levelVal,
    price: priceVal,
    search: search ?? "",
    page,
    sortBy: sortBy as (typeof SORT_BY_VALUES)[number],
    order: order as (typeof ORDER_VALUES)[number],
  };
}

export default function PublicCoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const searchParamsStr = sp?.toString() ?? "";

  const [category, setCategory] = useState<CourseCategory | "">(
    () => parseSearchParams(searchParamsStr).category,
  );
  const [level, setLevel] = useState<string>(
    () => parseSearchParams(searchParamsStr).level,
  );
  const [price, setPrice] = useState<"" | "free" | "paid">(
    () => parseSearchParams(searchParamsStr).price,
  );
  const [search, setSearch] = useState(
    () => parseSearchParams(searchParamsStr).search,
  );
  const [sort, setSort] = useState(() => {
    const init = parseSearchParams(searchParamsStr);
    return `${init.sortBy}|${init.order}`;
  });
  const [page, setPage] = useState(
    () => parseSearchParams(searchParamsStr).page,
  );

  const deferredSearch = useDeferredValue(search);
  const [sortBy, order] = sort.split("|") as [
    PublicCoursesParams["sortBy"],
    PublicCoursesParams["order"],
  ];

  // Keep the URL in sync with the active filters so the page can be bookmarked.
  // `replace` (not push) avoids flooding the history on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (category) params.set("category", category);
    if (level) params.set("level", level);
    if (price) params.set("price", price);
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    params.set("sortBy", sortBy ?? "publishedAt");
    params.set("order", order ?? "desc");

    const nextUrl = `${pathname}?${params.toString()}`;
    const currentUrl = `${pathname}?${searchParamsStr}`;
    if (nextUrl === currentUrl) return;

    router.replace(nextUrl, { scroll: false });
  }, [
    page,
    category,
    level,
    price,
    deferredSearch,
    sortBy,
    order,
    pathname,
    searchParamsStr,
    router,
  ]);

  const { data, isLoading, isError, isFetching, refetch } = usePublicCourses({
    page,
    limit: PAGE_SIZE,
    category: category || undefined,
    level: level ? (level as CourseLevel) : undefined,
    price: price || undefined,
    search: deferredSearch.trim() || undefined,
    sortBy,
    order,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const from = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const hasActiveFilters = Boolean(category || level || price || search.trim());

  const toggleCategory = (value: CourseCategory) => {
    setCategory((prev) => (prev === value ? "" : value));
    setPage(1);
  };

  const goToPage = (next: number) => {
    const target = Math.min(Math.max(1, next), totalPages);
    setPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setCategory("");
    setLevel("");
    setPrice("");
    setSearch("");
    setPage(1);
  };

  return (
    <section className="border-t border-border/60 bg-muted/30">
      <Container className="py-10 sm:py-12 lg:py-14">
        <header className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Khóa học
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Khám phá hơn 1.000 khóa học để phát triển kỹ năng của bạn
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Bộ lọc</h2>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-3 w-3" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Danh mục
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const active = category === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleCategory(option.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Mức giá
              </p>
              <Select
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value as "" | "free" | "paid");
                  setPage(1);
                }}
              >
                {PRICE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Cấp độ
              </p>
              <Select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
              >
                {LEVEL_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-auto sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm kiếm khóa học..."
                  className="pl-9"
                />
              </div>

              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              {meta
                ? `Hiển thị ${from}-${to} / ${meta.total} khóa học`
                : "Đang tải..."}
              {isFetching && !isLoading ? " (đang cập nhật)" : ""}
            </p>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <PublicCourseCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-border bg-background p-6 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  Không thể tải danh sách khóa học. Vui lòng thử lại.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy khóa học nào khớp với bộ lọc của bạn.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((course) => (
                  <PublicCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {meta && (
              <nav
                aria-label="Điều hướng trang"
                className="flex items-center justify-center"
              >
                <ul className="flex items-center gap-1">
                  <li>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Trang trước"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </li>

                  {pageRange(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <li
                        key={`ellipsis-${i}`}
                        className="px-1 text-sm text-muted-foreground"
                      >
                        …
                      </li>
                    ) : (
                      <li key={p}>
                        <Button
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8"
                          aria-current={p === page ? "page" : undefined}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </Button>
                      </li>
                    ),
                  )}

                  <li>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Trang sau"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
