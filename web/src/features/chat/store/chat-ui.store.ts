import { create } from "zustand";
import type { Message } from "../types/message.type";

/** Lightweight realtime metadata kept *only* on the client (no backend read receipts). */
export interface ConversationMetaState {
  lastMessage: Message | null;
  unread: number;
}

interface ChatUiState {
  activeConversationId: string | null;
  meta: Record<string, ConversationMetaState>;

  setActiveConversationId(id: string | null): void;
  /** Called by the SocketProvider on every `newMessage`. */
  receiveMessage(msg: Message): void;
  clearUnread(id: string): void;
}

export const chatUiStore = create<ChatUiState>()((set, get) => ({
  activeConversationId: null,
  meta: {},

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  receiveMessage: (msg) => {
    const active = get().activeConversationId === msg.conversationId;
    return set((s) => {
      const prev = s.meta[msg.conversationId] ?? {
        lastMessage: null,
        unread: 0,
      };
      return {
        meta: {
          ...s.meta,
          [msg.conversationId]: {
            lastMessage: msg,
            unread: active ? prev.unread : prev.unread + 1,
          },
        },
      };
    });
  },

  clearUnread: (id) =>
    set((s) => ({
      meta: {
        ...s.meta,
        [id]: {
          ...(s.meta[id] ?? { lastMessage: null, unread: 0 }),
          unread: 0,
        },
      },
    })),
}));
