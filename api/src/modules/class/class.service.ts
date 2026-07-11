import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { Prisma } from '@prisma/client';
import { ClassResponseDto } from './dto/class-response.dto';
import { generateClassCode } from '@common/utils/generate-code.util';
import { classSelect, toClassResponse } from './class.mapper';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

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

        return toClassResponse(newClass);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
      }
    }
  }
}
