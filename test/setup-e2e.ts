import { DataSource } from 'typeorm';
import { runSeedAdmin } from '../src/seeds/admin.seed';
import { seedCategories } from '../src/seeding/categorys.seeder';
import { seedUsers } from '../src/seeding/users.seeder';

export async function setupE2EDatabase(dataSource: DataSource) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('E2E setup can be used only in test environment');
  }

  // 1. Очистка БД
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    await dataSource.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
    );
  }

  // 2. Сиды
  await runSeedAdmin(dataSource);
  await seedUsers(dataSource);
  await seedCategories(dataSource);
}
