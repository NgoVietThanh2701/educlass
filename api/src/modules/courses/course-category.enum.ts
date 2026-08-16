/**
 * Course categories, stored as human-readable Vietnamese labels — the value IS
 * the display label (shown directly in badges/selects), matching what the
 * frontend exposes. `Course.category` is a `String?` column validated here —
 * this is deliberately NOT a Prisma enum.
 */
export enum CourseCategory {
  LAP_TRINH = 'Lập trình',
  MARKETING = 'Marketing',
  DESIGN = 'Design',
  DO_HOA = 'Đồ họa',
  TRUYEN_THONG = 'Truyền thông',
}
