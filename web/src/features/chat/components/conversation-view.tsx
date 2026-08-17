"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useChatSocket } from "@/features/chat/providers/socket-provider";
import { useConversation } from "@/features/chat/hooks/use-conversation";
import { useMessages } from "@/features/chat/hooks/use-messages";
import { useSendMessage } from "@/features/chat/hooks/use-send-message";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { chatUiStore } from "@/features/chat/store/chat-ui.store";
import { joinConversationRoom } from "@/features/chat/lib/socket";
import { toast } from "sonner";
import type {
  Message,
  SendMessagePayload,
} from "@/features/chat/types/message.type";
import { ConversationHeader } from "./conversation-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";

/** Merge server snapshot + client-side live deltas, deduped by id (oldest last). */
function mergeMessages(server: Message[], live: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of server) byId.set(m.id, m);
  for (const m of live) byId.set(m.id, m); // live overrides by id (dedupe)
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function ConversationView() {
  const { id } = useParams<{ id: string }>();
  const socket = useChatSocket();
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const courses = useCourses().data ?? [];
  const { data: convo, isLoading, isError } = useConversation(id);
  const { data: serverMessages = [] } = useMessages(id);
  const sendMessage = useSendMessage();
  const [live, setLive] = useState<Message[]>([]);

  const messages = useMemo(
    () => mergeMessages(serverMessages, live),
    [serverMessages, live],
  );

  // Track the active conversation so the socket listener updates unread counts.
  useEffect(() => {
    chatUiStore.getState().setActiveConversationId(id ?? null);
    if (id) chatUiStore.getState().clearUnread(id);
  }, [id]);

  // Join the socket room + apply live `newMessage` events (deduped by id).
  useEffect(() => {
    if (!socket || !id) return;

    joinConversationRoom(socket, id);

    const onNewMessage = (msg: Message) => {
      console.debug(
        "[chat] ConversationView newMessage:",
        msg.id,
        "conv=",
        msg.conversationId,
        "expected=",
        id,
      );
      if (msg.conversationId !== id) return;
      setLive((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      // The event also reaches the global unread tracker via the socket
      // provider; ensure the active conversation doesn't get re-counted.
    };
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [socket, id]);

  const handleSend = async (payload: SendMessagePayload) => {
    if (!id) return;
    try {
      const sent = await sendMessage.mutateAsync({ convId: id, payload });
      setLive((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
    } catch {
      toast.error("Không thể gửi tin nhắn.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !convo) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Không thể tải cuộc trò chuyện.
      </div>
    );
  }

  const isCourseTeacher =
    courses.find((c) => c.id === convo.courseId)?.teacherId === currentUserId;
  // When the group is TEACHER_ONLY, only the course teacher may send messages
  // (server enforces this too); students get the composer locked + a notice.
  const sendBlocked =
    convo.type === "GROUP" &&
    convo.messagePermission === "TEACHER_ONLY" &&
    !isCourseTeacher;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ConversationHeader conversation={convo} />
      <MessageList messages={messages} currentUserId={currentUserId} />
      {sendBlocked && (
        <div className="border-t border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
          Nhóm này đang chỉ cho phép giáo viên gửi tin nhắn. Bạn chỉ có thể đọc.
        </div>
      )}
      <MessageComposer
        onSend={handleSend}
        disabled={sendMessage.isPending || sendBlocked}
      />
    </div>
  );
}
