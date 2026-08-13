/**
 * Section types mirroring the backend section DTOs.
 * Endpoint: `/courses/:courseId/sections` (TEACHER only).
 */

/** Payload matching `CreateSectionDto` (title required, description/order optional). */
export interface CreateSectionRequest {
  title: string;
  description?: string;
}

/** Response matching `SectionResponseDto`. */
export interface SectionResponse {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Payload matching `UpdateSectionDto` (PartialType of CreateSectionDto). */
export type UpdateSectionRequest = Partial<CreateSectionRequest>;
