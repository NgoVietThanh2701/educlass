/**
 * Shared helpers for lesson video files (browser-side).
 */

/** Resolve the duration (in whole seconds) of a video `File` in the browser. */
export function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);

    const revoke = () => URL.revokeObjectURL(objectUrl);

    video.onloadedmetadata = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      revoke();
      resolve(duration);
    };

    video.onerror = () => {
      revoke();
      resolve(0);
    };

    video.src = objectUrl;
  });
}
