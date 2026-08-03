import { Injectable } from '@nestjs/common';
import { GroupMessagePermission } from '@prisma/client';
import { SendMessageDto } from '../dto/send-message.dto';
import { messageSelect, toMessageResponse } from '../mappers/message.mapper';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    if (!dto.content && (!dto.attachments || dto.attachments.length === 0)) {
      throw AppException.badRequest('Message must have content or attachments');
    }

    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.findUnique({
        where: { id: dto.conversationId },
        include: {
          participants: { where: { userId } },
          course: { select: { teacherId: true } },
        },
      });
      if (!conv) throw AppException.notFound('Conversation not found');
      if (conv.participants.length === 0) throw AppException.forbidden('You are not a participant');

      if (conv.type === 'GROUP' && conv.messagePermission === GroupMessagePermission.TEACHER_ONLY) {
        const course = await tx.course.findUnique({
          where: { id: conv.courseId! },
          select: { teacherId: true },
        });
        if (!course || course.teacherId !== userId) {
          throw AppException.forbidden('Only the course teacher can send messages in this group');
        }
      }

      const message = await tx.message.create({
        data: {
          conversationId: dto.conversationId,
          senderId: userId,
          content: dto.content || null,
          attachments: dto.attachments?.length
            ? {
                createMany: {
                  data: dto.attachments.map((attachment) => ({
                    ...attachment,
                    resourceType: attachment.resourceType ?? 'auto',
                  })),
                },
              }
            : undefined,
        },
        select: messageSelect,
      });

      await tx.conversation.update({
        where: { id: dto.conversationId },
        data: { updatedAt: new Date() },
      });

      return toMessageResponse(message);
    });
  }

  async getMessages(convId: string, userId: string, cursor?: string, limit = 50) {
    const isParticipant = await this.prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId: convId, userId } },
    });
    if (!isParticipant) throw AppException.forbidden('You are not a participant');

    const messages = await this.prisma.message.findMany({
      where: { conversationId: convId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'asc' },
      select: messageSelect,
    });
    return messages.map(toMessageResponse);
  }
}
