import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

export const messageSelect = Prisma.validator<Prisma.MessageSelect>()({
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  createdAt: true,
  sender: {
    select: {
      id: true,
      userName: true,
      fullName: true,
      email: true,
    },
  },
  attachments: {
    select: {
      id: true,
      objectKey: true,
      resourceType: true,
      filename: true,
      size: true,
      mimeType: true,
    },
  },
});

export type MessageWithRelations = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

export function toMessageResponse(message: MessageWithRelations) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: message.sender,
    content: message.content,
    attachments: message.attachments.map((att) => ({
      id: att.id,
      url: cloudinary.url(att.objectKey, {
        resource_type: att.resourceType ?? 'auto',
        secure: true,
      }),
      filename: att.filename,
      size: att.size,
      mimeType: att.mimeType,
    })),
    createdAt: message.createdAt,
  };
}
