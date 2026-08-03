import { Prisma } from '@prisma/client';

export const conversationSelect = Prisma.validator<Prisma.ConversationSelect>()({
  id: true,
  type: true,
  courseId: true,
  messagePermission: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          userName: true,
          fullName: true,
          email: true,
        },
      },
    },
  },
  _count: { select: { messages: true } },
});

export type ConversationWithRelations = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

export function toConversationResponse(conv: ConversationWithRelations) {
  return {
    id: conv.id,
    type: conv.type,
    courseId: conv.courseId,
    messagePermission: conv.messagePermission,
    participants: conv.participants.map((p) => ({
      userId: p.userId,
      userName: p.user.userName,
      fullName: p.user.fullName,
      email: p.user.email,
    })),
    messageCount: conv._count.messages,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}
