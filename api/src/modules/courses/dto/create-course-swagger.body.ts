import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

/** Swagger-only schema for multipart create course. Not used for @Body() validation. */
export class CreateCourseSwaggerBody extends CreateCourseDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  file: string;
}
