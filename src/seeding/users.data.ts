import { UserRole } from '../users/enums/user.enums';

export const UsersData = [
  {
    email: 'admin@test.ru',
    password: 'Admin12345!',
    role: UserRole.ADMIN,
  },
  {
    email: 'user1@test.ru',
    password: 'User12345!',
    role: UserRole.USER,
  },
  {
    email: 'user2@test.ru',
    password: 'User12345!',
    role: UserRole.USER,
  },
];
