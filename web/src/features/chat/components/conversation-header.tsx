"use client";

import { ArrowLeft, Loader2, UserLock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useUpdatePermission } from "@/features/chat/hooks/use-update-permission";
import {
  getConversationTitle,
  getConversationInitials,
  avatarColor,
} from "@/features/chat/lib/conversation-utils";
import type { Conversation } from "@/features/chat/types/conversation.type";

export function ConversationHeader({
  conversation,
}: {
  conversation?: Conversation;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const { data: courses = [] } = useCourses();
  const updatePermission = useUpdatePermission();

  if (!conversation) return null;

  const title = getConversationTitle(conversation, currentUserId, courses);
  const initials = getConversationInitials(conversation, currentUserId);
  const isGroup = conversation.type === "GROUP";
  const participantCount = conversation.participants.length;

  const course = courses.find((c) => c.id === conversation.courseId);
  const isCourseTeacher = course?.teacherId === currentUserId;
  const teacherOnly = conversation.messagePermission === "TEACHER_ONLY";

  const togglePermission = () => {
    if (!isCourseTeacher || !conversation.id) return;
    updatePermission.mutate({
      convId: conversation.id,
      permission: teacherOnly ? "ALL" : "TEACHER_ONLY",
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Quay lại"
          onClick={() => {
            window.history.back();
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <span
          className={cn(
            avatarColor(conversation.id),
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
          )}
        >
          {initials}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{title}</p>
            {isGroup && (
              <Badge variant="secondary" className="text-[10px]">
                Nhóm
              </Badge>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {participantCount} thành viên
          </p>
        </div>
      </div>

      {isGroup && isCourseTeacher && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-xs"
          onClick={togglePermission}
          disabled={updatePermission.isPending}
        >
          {updatePermission.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : teacherOnly ? (
            <UserLock className="h-3.5 w-3.5" />
          ) : (
            <Users className="h-3.5 w-3.5" />
          )}
          {teacherOnly ? "Chỉ giáo viên nhắn tin" : "Học viên được nhắn tin"}
        </Button>
      )}
    </div>
  );
}
