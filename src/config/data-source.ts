import 'dotenv/config';
import { DataSource } from 'typeorm';

// Сущности
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'skillswap',
  entities: [User, Skill], // все сущности массива
  synchronize: false, // только миграции, не auto-sync
  logging: process.env.DB_LOGGING === 'true',
});
