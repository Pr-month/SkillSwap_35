import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Gender } from '../enums/user.enums';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  city?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}
