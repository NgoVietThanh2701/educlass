"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  avatarColor,
  getInitials,
} from "@/features/chat/lib/conversation-utils";
import { formatMessageTime } from "@/features/chat/lib/format";
import type { Message } from "@/features/chat/types/message.type";

interface Props {
  message: Message;
  isMine: boolean;
}

export function MessageItem({ message, isMine }: Props) {
  const name =
    message.sender?.fullName ?? message.sender?.userName ?? "Người dùng";
  const initials = getInitials(name);
  const time = formatMessageTime(message.createdAt);

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <div
      className={cn(
        "flex w-full items-end gap-2",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine && (
        <span
          className={cn(
            avatarColor(message.senderId),
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          )}
        >
          {initials}
        </span>
      )}

      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm",
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {!isMine && <p className="mb-1 text-xs font-medium">{name}</p>}

        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:max-w-xs sm:grid-cols-3">
            {message.attachments.map((att) =>
              isImage(att.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={att.id}
                  src={att.url}
                  alt={att.filename}
                  className="max-h-24 w-full rounded border object-cover"
                />
              ) : (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs underline"
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{att.filename}</span>
                </a>
              ),
            )}
          </div>
        )}

        <p
          className={cn(
            "mt-1 text-[10px] opacity-70",
            isMine ? "text-right" : "text-left",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
