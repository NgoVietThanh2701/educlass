import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateConversationPermission } from "@/features/chat/api/conversation";
import { CONVERSATION_QUERY_KEYS } from "./use-conversations";
import type { GroupMessagePermission } from "@/features/chat/types/conversation.type";

/**
 * Updates the group message permission (teacher only): `ALL` lets enrolled
 * students send chat + files; `TEACHER_ONLY` restricts sending to the course
 * teacher. The teacher can always chat/send files in both modes (enforced
 * server-side).
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      convId,
      permission,
    }: {
      convId: string;
      permission: GroupMessagePermission;
    }) => updateConversationPermission(convId, permission),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATION_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CONVERSATION_QUERY_KEYS.detail(conv.id),
      });
      toast.success(
        conv.messagePermission === "TEACHER_ONLY"
          ? "Đã bật: chỉ giáo viên được gửi tin nhắn."
          : "Đã bật: học viên được gửi tin nhắn.",
      );
    },
    onError: () => {
      toast.error("Không thể cập nhật quyền gửi tin nhắn của nhóm.");
    },
  });
}
