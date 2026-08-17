"use client";

import { useRef, useEffect } from "react";
import { MessageItem } from "./message-item";
import { formatMessageDate } from "@/features/chat/lib/format";
import type { Message } from "@/features/chat/types/message.type";

interface Props {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  let lastDate = "";

  return (
    <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="h-full" />
      ) : (
        messages.map((msg) => {
          const date = formatMessageDate(msg.createdAt);
          const showDate = date !== lastDate;
          lastDate = date;
          return (
            <div key={msg.id} className="space-y-1">
              {showDate && (
                <div className="flex justify-center py-1">
                  <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {date}
                  </span>
                </div>
              )}
              <MessageItem
                message={msg}
                isMine={msg.senderId === currentUserId}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
