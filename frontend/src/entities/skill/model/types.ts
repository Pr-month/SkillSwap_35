import { User } from '@/entities/user/model/types';

/**
 * Тип навыка, соответствующий backend SkillDto
 */
export type Skill = {
  id: string;

  title: string;
  description: string;

  category: string;

  images: string[];

  owner: User;

  createdAt: string;
  updatedAt: string;
};