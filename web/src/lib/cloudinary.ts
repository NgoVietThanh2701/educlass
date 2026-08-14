/**
 * Cloudinary integration for the browser (frontend).
 *
 * Video lessons are uploaded DIRECTLY from the browser to Cloudinary's CDN —
 * they are never proxied through the backend. The backend only stores the
 * resulting Cloudinary `public_id` as the lesson content `objectKey`.
 *
 * SECURITY NOTE:
 *  - We ONLY expose public, client-safe values to the browser:
 *      `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`,
 *      `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
 *  - We use an **unsigned** upload preset, so the browser can upload without a
 *    server-side signature. Create it in the Cloudinary Dashboard
 *    (Settings → Upload → Upload presets → "Unsigned" mode) and put its name in
 *    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
 *  - The `api_secret` MUST NEVER be placed in the frontend (it is server-only,
 *    used by the backend `AttachmentService`). Exposing it would let anyone take
 *    over the Cloudinary account.
 */

import { CLOUDINARY_LESSON_VIDEO_FOLDER } from "@/features/courses/constants/upload";

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

/** Result of a successful direct browser upload to Cloudinary. */
export interface CloudinaryUploadResult {
  /** Cloudinary `public_id` — persisted as the lesson/attachment `objectKey`. */
  publicId: string;
  /** Full CDN URL of the uploaded asset. */
  secureUrl: string;
  /** Optional duration (whole seconds) reported by Cloudinary for videos. */
  durationSeconds?: number;
}

/** Read the browser-safe Cloudinary configuration from the environment. */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.trim();

  if (!cloudName || !uploadPreset) {
    return null;
  }

  return {
    cloudName,
    uploadPreset,
    apiKey: apiKey || undefined,
  };
}

/** Human-readable error message extracted from a Cloudinary error body. */
function extractCloudinaryError(rawText: string, fallback: string): string {
  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed?.error?.message === "string" && parsed.error.message) {
      return parsed.error.message;
    }
  } catch {
    // ignore — fall through to `fallback`
  }
  return fallback;
}

/**
 * Upload a single file (video) directly to Cloudinary from the browser.
 *
 * Uses `XMLHttpRequest` (instead of `fetch`) so we can report upload progress via
 * the `upload.onprogress` event. The request targets the unsigned Cloudinary
 * upload endpoint; authorization is the upload preset.
 */
export function uploadVideoToCloudinary(
  file: File,
  options?: { onProgress?: (percent: number) => void },
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config) {
    return Promise.reject(
      new Error(
        "Cloudinary chưa được cấu hình trên frontend. Vui lòng kiểm tra " +
          "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
      ),
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", CLOUDINARY_LESSON_VIDEO_FOLDER);
  // `resource_type` is encoded in the endpoint path (`/video/upload`), so the
  // upload is treated as a video regardless of the unsigned preset setting.

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            public_id?: string;
            secure_url?: string;
            duration?: number;
          };
          if (!data.public_id) {
            reject(new Error("Cloudinary không trả về public_id."));
            return;
          }
          resolve({
            publicId: data.public_id,
            secureUrl: data.secure_url ?? "",
            durationSeconds:
              typeof data.duration === "number" && data.duration > 0
                ? Math.round(data.duration)
                : undefined,
          });
        } catch {
          reject(new Error("Phản hồi từ Cloudinary không hợp lệ."));
        }
        return;
      }

      reject(
        new Error(
          extractCloudinaryError(
            xhr.responseText,
            `Tải video lên Cloudinary thất bại (HTTP ${xhr.status}).`,
          ),
        ),
      );
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Tải video lên Cloudinary thất bại do lỗi mạng."));
    });

    xhr.send(formData);
  });
}

/**
 * Build a Cloudinary video delivery URL from a stored `public_id`
 * (the lesson content `objectKey`).
 */
export function getCloudinaryVideoUrl(
  publicId: string,
  cloudName: string = getCloudinaryConfig()?.cloudName ?? "",
): string {
  if (!cloudName) {
    return publicId;
  }
  // `q_auto`/`f_auto` are safe delivery transformations for responsive video.
  return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
}
