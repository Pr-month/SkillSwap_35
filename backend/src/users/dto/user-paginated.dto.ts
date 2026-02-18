import { Expose, Type } from 'class-transformer';
import { UserDto } from './user.dto';

export class UserPaginatedDto {
  @Expose()
  @Type(() => UserDto)
  data: UserDto[];

  @Expose()
  page: number;

  @Expose()
  totalPages: number;
}
