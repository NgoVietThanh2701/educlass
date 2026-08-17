import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/features/chat/api/conversation";

export const CONVERSATION_QUERY_KEYS = {
  all: ["conversations"] as const,
  detail: (id: string) => ["conversations", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATION_QUERY_KEYS.all,
    queryFn: getConversations,
    staleTime: 30_000,
  });
}
