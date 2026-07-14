import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { UsersModule } from '@modules/users/users.module';

@Module({
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
  imports: [UsersModule],
})
export class ClassModule {}
