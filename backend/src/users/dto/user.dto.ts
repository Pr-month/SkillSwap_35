import { Expose, Type } from 'class-transformer';
import { SkillDto } from '../../skills/dto/skill.dto';
import { Gender, UserRole } from '../enums/user.enums';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  about: string | null;

  @Expose()
  birthdate: Date | null;

  @Expose()
  city: number | null;

  @Expose()
  gender: Gender;

  @Expose()
  avatar: string | null;

  @Expose()
  @Type(() => SkillDto)
  skills: SkillDto[];

  @Expose()
  wantToLearn: string[];

  @Expose()
  favoriteSkills: string[];

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
