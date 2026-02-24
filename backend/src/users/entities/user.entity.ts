import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender, UserRole } from '../enums/user.enums';
import { Skill } from '../../skills/entities/skill.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'date', nullable: true })
  birthdate: Date;

  @Column({ type: 'int', nullable: true })
  city: number;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.NOT_SPECIFIED,
    nullable: true,
  })
  gender: Gender;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @OneToMany(() => Skill, (skill) => skill.owner, {
    cascade: true,
  })
  skills: Skill[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'user_want_to_learn_skills',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'skill_id' },
  })
  wantToLearn: Skill[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'user_favorite_skills',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'skill_id' },
  })
  favoriteSkills: Skill[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
