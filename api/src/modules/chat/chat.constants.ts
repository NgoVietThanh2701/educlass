export const CHAT_MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024;

export const CHAT_ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
]);
