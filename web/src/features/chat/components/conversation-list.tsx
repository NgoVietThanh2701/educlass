"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useConversations } from "@/features/chat/hooks/use-conversations";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { chatUiStore } from "@/features/chat/store/chat-ui.store";
import {
  getConversationTitle,
  getConversationInitials,
  avatarColor,
} from "@/features/chat/lib/conversation-utils";
import { timeAgo } from "@/features/chat/lib/format";
import type { Conversation } from "@/features/chat/types/conversation.type";
import type { Message } from "@/features/chat/types/message.type";

interface Props {
  activeId?: string;
}

export function ConversationList({ activeId }: Props) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const { data: conversations = [], isLoading } = useConversations();
  const courses = useCourses().data ?? [];
  // Subscribe via the zustand hook so unread counters + last message re-render.
  const meta = chatUiStore((s) => s.meta);

  return (
    <nav className="flex h-full flex-col overflow-hidden">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Chưa có cuộc trò chuyện nào.
        </div>
      ) : (
        <ul className="flex-1 space-y-1 overflow-y-auto px-1">
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              courses={courses}
              currentUserId={currentUserId}
              active={c.id === activeId}
              meta={meta[c.id]}
              onClick={() => router.push(`/dashboard/message/${c.id}`)}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}

function ConversationRow({
  conv,
  courses,
  currentUserId,
  active,
  meta,
  onClick,
}: {
  conv: Conversation;
  courses: { id: string; title: string }[];
  currentUserId: string;
  active: boolean;
  meta: { lastMessage: Message | null; unread: number } | undefined;
  onClick: () => void;
}) {
  const title = getConversationTitle(conv, currentUserId, courses);
  const initials = getConversationInitials(conv, currentUserId);
  const last = meta?.lastMessage;
  const unread = meta?.unread ?? 0;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
          active ? "bg-accent" : "hover:bg-accent/60",
        )}
      >
        <span
          className={cn(
            avatarColor(conv.id),
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
          )}
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{title}</span>
            {last && (
              <span className="text-xs text-muted-foreground">
                {timeAgo(last.createdAt)}
              </span>
            )}
          </div>
          {last ? (
            <p className="truncate text-sm text-muted-foreground">
              {last.senderId === currentUserId ? "Bạn: " : ""}
              {last.content
                ? last.content
                : last.attachments?.length
                  ? `${last.attachments.length} tệp đính kèm`
                  : ""}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">
              {conv.messageCount} tin nhắn
            </span>
          )}
        </div>

        {unread > 0 && (
          <Badge className="mt-1 shrink-0 self-start">{unread}</Badge>
        )}
      </button>
    </li>
  );
}
