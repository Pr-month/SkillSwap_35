import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateSkillDto {
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  @Transform(({ value }: { value: string }) => value?.trim())
  title: string;

  @IsString({ message: 'Описание должно быть строкой' })
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @Transform(({ value }: { value: string }) => value?.trim() || null)
  description: string;

  @IsString({ message: 'Категория должна быть строкой' })
  @IsNotEmpty({ message: 'Категория не может быть пустой' })
  @Transform(({ value }: { value: string }) => value?.trim())
  category: string;

  @IsArray({ message: 'Изображения должны быть массивом' })
  @IsNotEmpty({ message: 'Изображения не могут быть пустыми' })
  images: string[];
}
