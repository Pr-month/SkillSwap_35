import { IsDefined, IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsEmail()
  @IsDefined()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
