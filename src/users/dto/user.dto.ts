import { Expose } from 'class-transformer';
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
  city: string | null;

  @Expose()
  gender: Gender | null;

  @Expose()
  avatar: string | null;

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
