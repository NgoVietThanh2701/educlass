import { PartialType } from '@nestjs/swagger';
import { AddOptionDto } from './add-option.dto';

export class UpdateOptionDto extends PartialType(AddOptionDto) {}
