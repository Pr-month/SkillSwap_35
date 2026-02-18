import {
  IsEmail,
  IsDefined,
  IsString,
  MinLength,
  Matches,
  IsDateString,
  IsISO8601,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Gender } from 'src/users/enums/user.enums';

export class RegisterDto {
  @IsEmail()
  @IsDefined()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsDefined()
  @MinLength(2)
  name: string;

  @IsDateString()
  @IsISO8601()
  @IsNotEmpty()
  birthdate: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  city: string;

  @IsString()
  about: string;
}
