// dto/update-permission.dto.ts
import { IsEnum } from 'class-validator';
import { GroupMessagePermission } from '@prisma/client';

export class UpdatePermissionDto {
  @IsEnum(GroupMessagePermission)
  permission: GroupMessagePermission;
}
