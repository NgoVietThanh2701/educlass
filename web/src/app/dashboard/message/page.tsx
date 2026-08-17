"use client";

import { ConversationList } from "@/features/chat/components/conversation-list";

export default function MessageInboxPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold">Hộp thư</h1>
      </div>
      <div className="min-h-0 flex-1">
        <ConversationList />
      </div>
    </div>
  );
}
