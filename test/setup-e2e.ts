import { AppDataSource } from '../src/config/db.config';
import { seedAdmin } from '../src/seeds/admin.seed';
import { seedCategories } from '../src/seeding/categorys.seeder';
import { seedUsers } from '../src/seeding/users.seeder';

export async function setupE2EDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // Очистка всех таблиц
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.clear();
  }

  // Сиды
  await seedAdmin();
  await seedUsers(AppDataSource);
  await seedCategories(AppDataSource);
}
