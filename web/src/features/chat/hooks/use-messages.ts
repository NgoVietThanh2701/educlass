import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/features/chat/api/message";
import { CONVERSATION_QUERY_KEYS } from "./use-conversations";
import type { Message } from "@/features/chat/types/message.type";

export const MESSAGE_QUERY_KEYS = {
  all: (convId: string) =>
    [...CONVERSATION_QUERY_KEYS.detail(convId), "messages"] as const,
};

export function useMessages(
  convId: string | undefined,
  opts?: { enabled?: boolean },
) {
  return useQuery<Message[]>({
    queryKey: convId ? MESSAGE_QUERY_KEYS.all(convId) : ["messages", "none"],
    queryFn: () => getMessages(convId as string, { limit: 50 }),
    enabled: !!convId && (opts?.enabled ?? true),
    staleTime: 30_000,
  });
}
