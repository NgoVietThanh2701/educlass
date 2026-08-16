"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import type { Course } from "../types/course.type";
import {
  categoryColumn,
  createLevelColumn,
  createPriceColumn,
  thumbnailColumn,
  titleColumn,
} from "./course-columns";

// Column helper scoped to the student list row type.
const columnHelper = createColumnHelper<Course>();

/**
 * STUDENT-facing course list columns.
 *
 * The base columns (thumbnail / title / category / level / price) come from the
 * SAME factories `createCourseColumns` uses — this module only adds the
 * student-only "progress" placeholder and the "Vào học" action, so the two role
 * lists can never drift apart while the student view stays intentionally
 * leaner than the teacher management columns.
 */
export interface StudentCourseColumnsOptions {
  /** Navigate the student to their learning hub for a course. */
  onStudy: (course: Course) => void;
}

const progressColumn: ColumnDef<Course, unknown> = {
  id: "progress",
  header: "Tiến độ",
  // Progress tracking is driven by a (not yet implemented) student-progress API.
  // For now we surface a neutral placeholder so the column is reserved.
  cell: () => (
    <span className="text-sm text-muted-foreground">Chưa bắt đầu</span>
  ),
};

/** "Vào học" action column — routes the student to their learning hub. */
function studyActionColumn(
  options: StudentCourseColumnsOptions,
): ColumnDef<Course, unknown> {
  return columnHelper.display({
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => options.onStudy(course)}
        >
          <BookOpen className="h-4 w-4" />
          Vào học
        </Button>
      );
    },
  }) as ColumnDef<Course, unknown>;
}

export function createStudentCourseColumns(
  options: StudentCourseColumnsOptions,
): ColumnDef<Course, unknown>[] {
  return [
    thumbnailColumn,
    titleColumn,
    categoryColumn,
    createLevelColumn("outline"),
    createPriceColumn({ showFreeLabel: true, header: "Học phí" }),
    progressColumn,
    studyActionColumn(options),
  ];
}