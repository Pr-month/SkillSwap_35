import { AppDataSource } from '../config/db.config';
import { seedCities } from './cities.seeder';

;(async () => {
  await AppDataSource.initialize();

  try {
    await seedCities(AppDataSource);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
})();
