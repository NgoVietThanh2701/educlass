/**
 * Upload configuration for course lesson videos.
 *
 * Video lessons are uploaded DIRECTLY from the browser to Cloudinary
 * (see `@/lib/cloudinary`). These constants are shared by the upload helper and
 * (later) the video player so the CDN folder stays consistent.
 */

/** Cloudinary folder where lesson videos are stored. */
export const CLOUDINARY_LESSON_VIDEO_FOLDER = "lesson-videos";
