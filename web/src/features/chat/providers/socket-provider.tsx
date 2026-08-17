"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import {
  disconnectChatSocket,
  getChatSocket,
  initChatSocket,
  subscribeSocketListener,
} from "@/features/chat/lib/socket";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { chatUiStore } from "@/features/chat/store/chat-ui.store";
import type { Message } from "@/features/chat/types/message.type";

const ChatSocketContext = createContext<Socket | undefined>(undefined);

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Subscribe to the module-level socket singleton via React's built-in
  // external-store hook. This keeps the socket reference in sync WITHOUT
  // calling setState inside an effect (which trips the `set-state-in-effect`
  // lint rule). The effect below only performs external side effects.
  const socket = useSyncExternalStore(
    subscribeSocketListener,
    getChatSocket,
    getChatSocket,
  );

  useEffect(() => {
    if (!accessToken) {
      disconnectChatSocket();
      return;
    }

    const sock = initChatSocket(accessToken);

    // --- diagnostic (temporary) ---
    sock.on("connect", () =>
      console.log("[chat-socket] connected id=" + sock.id),
    );
    sock.on("connect_error", (e) =>
      console.error("[chat-socket] connect_error:", e?.message ?? e),
    );
    // --- end diagnostic ---

    const onNewMessage = (message: Message) => {
      console.debug(
        "[chat-socket] newMessage received:",
        message.id,
        "conv=",
        message.conversationId,
      );
      chatUiStore.getState().receiveMessage(message);
    };
    sock.on("newMessage", onNewMessage);

    return () => {
      sock.off("newMessage", onNewMessage);
      disconnectChatSocket();
    };
  }, [accessToken]);

  return (
    <ChatSocketContext.Provider value={socket ?? undefined}>
      {children}
    </ChatSocketContext.Provider>
  );
}

/** Returns the shared socket (if initialised) — used to emit/consume events. */
export function useChatSocket(): Socket | undefined {
  return useContext(ChatSocketContext);
}
