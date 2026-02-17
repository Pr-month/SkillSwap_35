import { ConfigType, registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// 🔥 ЯВНО выбираем env-файл
const envFile = process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env';

dotenv.config({ path: envFile });

export const dbConfig = registerAs(
  'DB_CONFIG',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'skillswap',

    synchronize: false, // ❗ только миграции
    logging: process.env.DB_LOGGING === 'true',
  }),
);

export type TDBConfig = ConfigType<typeof dbConfig>;
