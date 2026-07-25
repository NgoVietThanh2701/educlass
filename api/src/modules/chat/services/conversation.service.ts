import { Injectable } from '@nestjs/common';
import { ConversationType, GroupMessagePermission } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { conversationSelect, toConversationResponse } from '../mappers/conversation.mapper';
import { AppException } from '@common/exceptions/app.exception';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGetDirect(userId: string, targetUserId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      select: conversationSelect,
    });
    if (existing) return toConversationResponse(existing);

    const newConv = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      select: conversationSelect,
    });
    return toConversationResponse(newConv);
  }

  async createOrGetGroup(classId: string, userId: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { classId },
      select: conversationSelect,
    });
    if (existing) {
      await this.ensureParticipant(existing.id, userId);
      const updated = await this.prisma.conversation.findUnique({
        where: { id: existing.id },
        select: conversationSelect,
      });
      return toConversationResponse(updated!);
    }

    const classWithMembers = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        teacherId: true,
        classStudents: { select: { studentId: true } },
      },
    });
    if (!classWithMembers) throw AppException.notFound('Class not found');

    const memberIds = [
      classWithMembers.teacherId,
      ...classWithMembers.classStudents.map((cs) => cs.studentId),
    ];

    const newConv = await this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        classId,
        messagePermission: GroupMessagePermission.ALL,
        participants: {
          create: memberIds.map((id) => ({ userId: id })),
        },
      },
      select: conversationSelect,
    });
    return toConversationResponse(newConv);
  }

  async addUserToGroupChat(classId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { classId },
      select: { id: true },
    });
    if (!conv) return;
    await this.ensureParticipant(conv.id, userId);
  }

  async updatePermission(convId: string, teacherId: string, permission: GroupMessagePermission) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
      select: { class: { select: { teacherId: true } } },
    });
    if (!conv) throw AppException.notFound('Conversation not found');
    if (conv.class?.teacherId !== teacherId)
      throw AppException.forbidden('Only class teacher can change permission');

    const updated = await this.prisma.conversation.update({
      where: { id: convId },
      data: { messagePermission: permission },
      select: conversationSelect,
    });
    return toConversationResponse(updated);
  }

  async getConversationsForUser(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      select: conversationSelect,
    });
    return convs.map(toConversationResponse);
  }

  async findOne(convId: string, userId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: convId, participants: { some: { userId } } },
      select: conversationSelect,
    });
    if (!conv) throw AppException.notFound('Conversation not found');
    return toConversationResponse(conv);
  }

  private async ensureParticipant(convId: string, userId: string) {
    await this.prisma.participant.upsert({
      where: { conversationId_userId: { conversationId: convId, userId } },
      create: { conversationId: convId, userId },
      update: {},
    });
  }

  async isUserParticipant(convId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.participant.count({
      where: { conversationId: convId, userId },
    });
    return count > 0;
  }
}
