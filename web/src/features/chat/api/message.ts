import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type {
  Message,
  MessageAttachment,
  SendMessagePayload,
} from "../types/message.type";

export interface GetMessagesParams {
  cursor?: string;
  limit?: number;
}

/** Returns messages ordered oldest → newest (cursor pagination). */
export async function getMessages(
  convId: string,
  params?: GetMessagesParams,
): Promise<Message[]> {
  const res = await axiosInstance.get<ApiResponse<Message[]>>(
    `${API_ENDPOINT.CONVERSATIONS}/${convId}/messages`,
    { params },
  );
  return res.data.data;
}

export async function sendMessage(
  convId: string,
  payload: SendMessagePayload,
): Promise<Message> {
  const res = await axiosInstance.post<ApiResponse<Message>>(
    `${API_ENDPOINT.CONVERSATIONS}/${convId}/messages`,
    payload,
  );
  return res.data.data;
}

export interface UploadedChatFile {
  objectKey: string;
  url: string;
  resourceType: string;
  filename: string;
  size: number;
  mimeType: string;
}

/** Uploads an attachment; returns a payload ready to attach to a message. */
export async function uploadChatFile(file: File): Promise<UploadedChatFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await axiosInstance.post<
    ApiResponse<{ objectKey: string; url: string; resourceType: string }>
  >(`${API_ENDPOINT.CONVERSATIONS}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const d = res.data.data;
  return {
    objectKey: d.objectKey,
    url: d.url,
    resourceType: d.resourceType,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

/** Build a frontend `MessageAttachment` DTO from an uploaded file. */
export function toMessageAttachment(
  uploaded: UploadedChatFile,
): MessageAttachment {
  return {
    id: uploaded.objectKey,
    url: uploaded.url,
    filename: uploaded.filename,
    size: uploaded.size,
    mimeType: uploaded.mimeType,
  };
}
