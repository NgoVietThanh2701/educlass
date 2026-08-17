import { useMutation } from "@tanstack/react-query";
import { sendMessage as sendMessageApi } from "@/features/chat/api/message";
import type { SendMessagePayload } from "@/features/chat/types/message.type";

interface SendArgs {
  convId: string;
  payload: SendMessagePayload;
}

/**
 * Sends a message via the REST API. The server-side gateway echoes the new
 * message back to the conversation room through the `newMessage` socket event,
 * so the optimistic append in the view is reconciled (deduped by id) when the
 * echo arrives.
 */
export function useSendMessage() {
  return useMutation({
    mutationFn: ({ convId, payload }: SendArgs) =>
      sendMessageApi(convId, payload),
  });
}
