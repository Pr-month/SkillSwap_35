import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env';

require('dotenv').config({ path: envFile });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [User, Skill],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
