import { useQuery } from "@tanstack/react-query";
import { getConversation } from "@/features/chat/api/conversation";
import { CONVERSATION_QUERY_KEYS } from "./use-conversations";

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? CONVERSATION_QUERY_KEYS.detail(id)
      : ["conversation", "none"],
    queryFn: () => getConversation(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });
}
