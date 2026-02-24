import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SkillQueryDto {
  @IsOptional()
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы должен быть не менее 1' })
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt({ message: 'Лимит должен быть целым числом' })
  @Min(1, { message: 'Лимит должен быть не менее 1' })
  @Max(100, { message: 'Лимит не должен превышать 100' })
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsString({ message: 'Поисковый запрос должен быть строкой' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  search: string = '';

  @IsOptional()
  @IsString({ message: 'Категория должна быть строкой' })
  @Transform(({ value }: { value: string }) => value?.trim())
  category: string = '';
}
