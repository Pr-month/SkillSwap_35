import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../users/dto/user.dto';

export class SkillDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  category: string;

  @Expose()
  images: string[];

  @Expose()
  @Type(() => UserDto)
  owner: UserDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
