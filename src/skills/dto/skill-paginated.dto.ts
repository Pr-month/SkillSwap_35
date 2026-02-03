import { Expose, Type } from 'class-transformer';
import { SkillDto } from './skill.dto';

export class SkillPaginatedDto {
  @Expose()
  @Type(() => SkillDto)
  data: SkillDto[];

  @Expose()
  page: number;

  @Expose()
  totalPages: number;
}
