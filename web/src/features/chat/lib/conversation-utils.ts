import type { Conversation } from "@/features/chat/types/conversation.type";

export function getOtherParticipant(conv: Conversation, currentUserId: string) {
  return conv.participants.find((p) => p.userId !== currentUserId);
}

export function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function getConversationTitle(
  conv: Conversation,
  currentUserId: string,
  courses?: { id: string; title: string }[],
): string {
  if (conv.type === "GROUP") {
    const course = courses?.find((c) => c.id === conv.courseId);
    return course?.title ?? "Nhóm trò chuyện";
  }
  const other = getOtherParticipant(conv, currentUserId);
  return other?.fullName ?? other?.userName ?? "Người dùng";
}

export function getConversationInitials(
  conv: Conversation,
  currentUserId: string,
): string {
  if (conv.type === "DIRECT") {
    const other = getOtherParticipant(conv, currentUserId);
    return getInitials(other?.fullName ?? other?.userName ?? "Người dùng");
  }
  return "NHÓM";
}

const COLORS = [
  "bg-sky-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-fuchsia-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-cyan-400",
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return COLORS[hash % COLORS.length];
}
