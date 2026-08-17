// Mirror of the backend chat DTOs (the frontend cannot import @prisma/client).

export type ConversationType = "DIRECT" | "GROUP";
export type GroupMessagePermission = "ALL" | "TEACHER_ONLY";

export interface ConversationParticipant {
  userId: string;
  userName: string;
  fullName: string;
  email: string | null;
}

/** Shape returned by `toConversationResponse` on the backend. */
export interface Conversation {
  id: string;
  type: ConversationType;
  courseId: string | null;
  messagePermission: GroupMessagePermission | null;
  participants: ConversationParticipant[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
