import { AppDataSource } from '../src/config/db.config';
import { runSeedAdmin } from '../src/seeds/admin.seed';
import { seedCategories } from '../src/seeding/categorys.seeder';
import { seedUsers } from '../src/seeding/users.seeder';

export async function setupE2EDatabase() {
  // 1. Инициализация БД
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // 2. Опционально: синхронизация схемы (создает таблицы)
  await AppDataSource.synchronize(true); // true = сброс всех таблиц

  // 3. Очистка всех таблиц
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    await AppDataSource.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
  }

  // 4. Сиды
  await runSeedAdmin();
  await seedUsers(AppDataSource);
  await seedCategories(AppDataSource);
}
