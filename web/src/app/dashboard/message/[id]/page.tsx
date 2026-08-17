"use client";

import { useParams } from "next/navigation";

import { ConversationList } from "@/features/chat/components/conversation-list";
import { ConversationView } from "@/features/chat/components/conversation-view";

export default function MessageThreadPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Hộp thư
          </h2>
        </div>
        <div className="min-h-0 flex-1">
          <ConversationList activeId={id} />
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        <ConversationView key={id ?? "none"} />
      </main>
    </div>
  );
}
