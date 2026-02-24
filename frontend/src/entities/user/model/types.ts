import { Skill } from '@/entities/skill/model/types';

/**
 * Тип пользователя, соответствующий backend UserDto
 */
export type User = {
  id: string;

  name: string;
  email: string;

  about: string | null;
  birthdate: string | null; // Date приходит как ISO-строка
  city: string | null;

  gender: 'NOT_SPECIFIED' | 'MALE' | 'FEMALE';

  avatar: string | null;

  skills: Skill[];
  wantToLearn: Skill[];
  favoriteSkills: Skill[];

  role: 'USER' | 'ADMIN';

  createdAt: string;
  updatedAt: string;
};