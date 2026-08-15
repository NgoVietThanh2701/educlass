"use client";

import {
  createColumnHelper,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, BookOpen } from "lucide-react";
import type {
  Course,
  CourseStatus,
  CourseLevel,
  TeacherCourse,
} from "../types/course.type";
import { LEVEL_LABELS, STATUS_CONFIG } from "../constants/course";
import { formatDate, formatPrice } from "../utils/format";

// Create column helper with generic for the row type only
const columnHelper = createColumnHelper<Course>();

export interface CourseColumnsOptions {
  /** True when the current user is a TEACHER (shows status + manage actions). */
  isTeacher: boolean;
  onView?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  /** Used by STUDENT role (study entry — teaching flow to be built later). */
  onStudy?: (course: Course) => void;
}

// Columns shared by both roles.
const thumbnailColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.thumbnailUrl,
  {
    id: "thumbnail",
    header: "Ảnh",
    cell: ({ getValue }) => {
      const url = getValue() as string | null | undefined;
      if (!url) {
        return (
          <div className="flex h-12 w-20 items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
            Không có
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="thumbnail"
          className="h-12 w-20 rounded-md object-cover"
          loading="lazy"
        />
      );
    },
  },
) as ColumnDef<Course, unknown>;

const titleColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.title,
  {
    id: "title",
    header: "Khóa học",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.getValue("title")}</p>
        <p className="text-sm text-muted-foreground">
          {row.original.shortDescription}
        </p>
      </div>
    ),
  },
) as ColumnDef<Course, unknown>;

const levelColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.level,
  {
    id: "level",
    header: "Cấp độ",
    cell: ({ getValue }) => {
      const level = getValue() as CourseLevel | undefined;
      const label = level ? LEVEL_LABELS[level] : "-";
      return <Badge variant="secondary">{label}</Badge>;
    },
  },
) as ColumnDef<Course, unknown>;

const statusColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => (row as TeacherCourse).status,
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ getValue }) => {
      const status = getValue() as CourseStatus | undefined;
      const config = status
        ? STATUS_CONFIG[status]
        : { label: "-", variant: "secondary" as const };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
) as ColumnDef<Course, unknown>;

const priceColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.price,
  {
    id: "price",
    header: "Giá",
    cell: ({ getValue }) => formatPrice(getValue() as number | undefined),
  },
) as ColumnDef<Course, unknown>;

const languageColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.language,
  {
    id: "language",
    header: "Ngôn ngữ",
    cell: ({ getValue }) => {
      const value = getValue() as string | undefined;
      return value ? value.toUpperCase() : "-";
    },
  },
) as ColumnDef<Course, unknown>;

const durationColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.estimatedDuration,
  {
    id: "estimatedDuration",
    header: "Thời lượng (phút)",
    cell: ({ getValue }) => {
      const value = getValue() as number | null | undefined;
      return value !== null && value !== undefined ? String(value) : "-";
    },
  },
) as ColumnDef<Course, unknown>;

const publishedAtColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.publishedAt,
  {
    id: "publishedAt",
    header: "Ngày xuất bản",
    cell: ({ getValue }) =>
      formatDate(getValue() as Date | string | null | undefined),
  },
) as ColumnDef<Course, unknown>;

const createdAtColumn: ColumnDef<Course, unknown> = columnHelper.accessor(
  (row) => row.createdAt,
  {
    id: "createdAt",
    header: "Ngày tạo",
    cell: ({ getValue }) => formatDate(getValue() as Date | string),
  },
) as ColumnDef<Course, unknown>;

const BASE_COLUMNS: ColumnDef<Course, unknown>[] = [
  thumbnailColumn,
  titleColumn,
  levelColumn,
  priceColumn,
  languageColumn,
  durationColumn,
  publishedAtColumn,
  createdAtColumn,
];

function actionsColumn(options: CourseColumnsOptions): ColumnDef<Course, unknown> {
  return columnHelper.display({
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const course = row.original;

      // STUDENT role: only a "study" entry (teaching flow built later).
      if (!options.isTeacher) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => options.onStudy?.(course)}
            className="gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            Vào học
          </Button>
        );
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => options.onView?.(course)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Xem
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => options.onEdit?.(course)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => options.onDelete?.(course)}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }) as ColumnDef<Course, unknown>;
}

export function createCourseColumns(
  options: CourseColumnsOptions,
): ColumnDef<Course, unknown>[] {
  const columns = [...BASE_COLUMNS];

  // The status column (teacher-only) is inserted right after "Cấp độ".
  if (options.isTeacher) {
    columns.splice(3, 0, statusColumn);
  }

  columns.push(actionsColumn(options));
  return columns;
}

export type { ColumnFiltersState, PaginationState, SortingState };