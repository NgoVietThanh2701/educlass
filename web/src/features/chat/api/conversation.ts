import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type {
  Conversation,
  GroupMessagePermission,
} from "../types/conversation.type";

export async function getConversations(): Promise<Conversation[]> {
  const res = await axiosInstance.get<ApiResponse<Conversation[]>>(
    API_ENDPOINT.CONVERSATIONS,
  );
  return res.data.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await axiosInstance.get<ApiResponse<Conversation>>(
    `${API_ENDPOINT.CONVERSATIONS}/${id}`,
  );
  return res.data.data;
}

export async function createDirectConversation(
  targetUserId: string,
): Promise<Conversation> {
  const res = await axiosInstance.post<ApiResponse<Conversation>>(
    `${API_ENDPOINT.CONVERSATIONS}/direct`,
    { targetUserId },
  );
  return res.data.data;
}

export async function createGroupConversation(
  courseId: string,
): Promise<Conversation> {
  const res = await axiosInstance.post<ApiResponse<Conversation>>(
    `${API_ENDPOINT.CONVERSATIONS}/group`,
    { courseId },
  );
  return res.data.data;
}

export async function updateConversationPermission(
  convId: string,
  permission: GroupMessagePermission,
): Promise<Conversation> {
  const res = await axiosInstance.patch<ApiResponse<Conversation>>(
    `${API_ENDPOINT.CONVERSATIONS}/${convId}/permission`,
    { permission },
  );
  return res.data.data;
}
