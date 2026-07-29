import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { Prisma, RoleUser } from '@prisma/client';
import { ClassDetailResponseDto, ClassResponseDto } from './dto/class-response.dto';
import { generateClassCode } from '@common/utils/generate-code.util';
import {
  classDetailSelect,
  classSelect,
  toClassDetailResponse,
  toClassResponse,
} from './class.mapper';
import { AppException } from '@common/exceptions/app.exception';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { UpdateClassDto } from './dto/update-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { SEQUENCE } from '@modules/auth/auth.constants';
import { UserNameUtil } from '@common/utils/username.util';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/student.dto';
import { ConversationService } from '@modules/chat/services/conversation.service';

@Injectable()
export class ClassService {
  private readonly SALT_ROUNDS = 12;
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
  ) {}

  // Create class (Only teacher)
  async create(teacherId: string, dto: CreateClassDto): Promise<ClassResponseDto> {
    const { name, description } = dto;
    while (true) {
      const code = generateClassCode();
      try {
        const newClass = await this.prisma.class.create({
          data: {
            name,
            description,
            code,
            teacherId,
          },
          select: classSelect,
        });

        await this.conversationService.createOrGetGroup(newClass.id, teacherId);

        return toClassResponse(newClass);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION
        ) {
          continue;
        }
      }
    }
  }

  // Get class of teacher or student
  async findAll(userId: string, role: RoleUser): Promise<ClassResponseDto[]> {
    switch (role) {
      case RoleUser.TEACHER: {
        const classes = await this.prisma.class.findMany({
          where: {
            teacherId: userId,
            archivedAt: null,
          },
          select: classSelect,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return classes.map(toClassResponse);
      }

      case RoleUser.STUDENT: {
        const classes = await this.prisma.class.findMany({
          where: {
            archivedAt: null,
            classStudents: {
              some: {
                studentId: userId,
              },
            },
          },
          select: classSelect,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return classes.map(toClassResponse);
      }

      default:
        throw AppException.forbidden('Invalid role');
    }
  }

  // find One class by id and role
  async findOne(classId: string, userId: string, role: RoleUser): Promise<ClassDetailResponseDto> {
    const cls = await this.findClassOrThrow(classId, classDetailSelect);
    switch (role) {
      case RoleUser.TEACHER:
        this.ensureTeacherOwnsClass(cls.teacher.id, userId);
        break;

      case RoleUser.STUDENT:
        if (!(await this.isStudentInClass(classId, userId)))
          throw AppException.forbidden('Student is not in this class');
        break;

      default:
        throw AppException.forbidden('');
    }

    return toClassDetailResponse(cls);
  }

  // Update class (Only teacher)
  async update(classId: string, teacherId: string, dto: UpdateClassDto) {
    const cls = await this.findClassOrThrow(classId, { teacherId: true });
    this.ensureTeacherOwnsClass(cls.teacherId, teacherId);

    const updated = await this.prisma.class.update({
      where: { id: classId },
      data: dto,
      select: classSelect,
    });
    return toClassResponse(updated);
  }

  // remove class (archive) (Only teacher)
  async remove(classId: string, teacherId: string): Promise<void> {
    const cls = await this.findClassOrThrow(classId, { teacherId: true });
    this.ensureTeacherOwnsClass(cls.teacherId, teacherId);

    await this.prisma.class.update({
      where: { id: classId },
      data: { archivedAt: new Date() },
    });
  }

  // Add userName student to class (Only teacher)
  async addStudent(classId: string, teacherId: string, dto: AddStudentDto): Promise<void> {
    const cls = await this.findClassOrThrow(classId, { teacherId: true });
    this.ensureTeacherOwnsClass(cls.teacherId, teacherId);

    // check user is student
    const student = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
      select: { id: true, role: true },
    });
    if (!student || student.role !== RoleUser.STUDENT) {
      throw AppException.forbidden('Member is not valid');
    }

    // Check student belong class?
    const existing = await this.isStudentInClass(classId, student.id);
    if (existing) throw AppException.conflict('Student belong to class');

    await this.prisma.classStudent.create({
      data: {
        classId,
        studentId: student.id,
      },
    });
  }

  // Remove a student from class (Only teacher)
  async removeStudent(classId: string, teacherId: string, studentId: string): Promise<void> {
    const cls = await this.findClassOrThrow(classId, { teacherId: true });
    this.ensureTeacherOwnsClass(cls.teacherId, teacherId);

    // Check student belong class?
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== RoleUser.STUDENT) {
      throw AppException.forbidden('Member is not valid');
    }
    const existing = await this.isStudentInClass(classId, student.id);
    if (!existing) throw AppException.conflict('Student not belong to class');

    await this.prisma.classStudent.delete({
      where: { classId_studentId: { classId, studentId } },
    });
  }

  // Leave class (Only student)
  async leaveClass(classId: string, studentId: string) {
    const enrollment = await this.prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    if (!enrollment) throw AppException.notFound('Not found class');
    await this.prisma.classStudent.delete({
      where: { classId_studentId: { classId, studentId } },
    });
  }

  // Create student and add to class (Only teacher)
  async createStudent(classId: string, teacherId: string, dto: CreateStudentDto): Promise<void> {
    const cls = await this.findClassOrThrow(classId, { id: true, teacherId: true });
    this.ensureTeacherOwnsClass(cls.teacherId, teacherId);

    const studentNo = await this.prisma.nextSequence(SEQUENCE.STUDENT);
    const userName = UserNameUtil.student(studentNo);
    const defaultPassword = this.studentPassword(dto.fullName, userName);

    const passwordHash = await bcrypt.hash(defaultPassword, this.SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      const student = await tx.user.create({
        data: {
          fullName: dto.fullName,
          userName,
          passwordHash,
          role: RoleUser.STUDENT,
          mustChangePassword: true,
        },
        select: {
          id: true,
          fullName: true,
          userName: true,
        },
      });

      await tx.classStudent.create({
        data: {
          classId,
          studentId: student.id,
        },
      });

      await this.conversationService.addUserToGroupChat(cls.id, cls.teacherId);
    });
  }

  // ----------- helper --------------

  private async isStudentInClass(classId: string, studentId: string): Promise<boolean> {
    const exists = await this.prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
      select: {
        classId: true,
      },
    });

    return !!exists;
  }

  private ensureTeacherOwnsClass(teacherIdClass: string, teacherId: string) {
    if (teacherIdClass !== teacherId) {
      throw AppException.forbidden('You are not owner class');
    }
  }

  private async findClassOrThrow<T extends Prisma.ClassSelect>(
    classId: string,
    select: T,
  ): Promise<Prisma.ClassGetPayload<{ select: T }>> {
    const cls = await this.prisma.class.findFirst({
      where: {
        id: classId,
        archivedAt: null,
      },
      select,
    });

    if (!cls) {
      throw AppException.notFound('Class is not found');
    }
    return cls;
  }

  // generate password dafault for student
  private studentPassword(fullName: string, userName: string): string {
    const prefix = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0].toLowerCase())
      .join('');

    const last3 = userName.slice(-3);

    return `${prefix}@${last3}`;
  }
}
