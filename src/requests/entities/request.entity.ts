import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;

  @ManyToOne(() => Skill)
  requestedSkill: Skill;

  @ManyToOne(() => Skill)
  offeredSkill: Skill;

  @CreateDateColumn()
  createdAt: Date;
}
