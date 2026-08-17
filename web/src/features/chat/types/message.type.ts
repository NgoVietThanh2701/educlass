export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface MessageSender {
  id: string;
  userName: string;
  fullName: string;
  email: string | null;
}

/** Shape returned by `toMessageResponse` on the backend. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: MessageSender;
  content: string | null;
  attachments: MessageAttachment[];
  createdAt: string;
}

/** Payload for `POST /conversations/:convId/messages`. */
export interface SendMessagePayload {
  content?: string;
  attachments?: MessageAttachment[];
}
