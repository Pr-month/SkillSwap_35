import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './categories.data';
import { AppDataSource } from '../config/db.config';

export async function seedCategories(dataSource: DataSource) {
  const categoryRepository = dataSource.getRepository(Category);

  for (const parentCategoryData of CategoriesData) {

    let parentCategory = await categoryRepository.findOne({
      where: { name: parentCategoryData.name },
    });

    if (!parentCategory) {
      parentCategory = categoryRepository.create({
        name: parentCategoryData.name,
      });

      parentCategory = await categoryRepository.save(parentCategory);
    }

    for (const childName of parentCategoryData.children) {
      const existingChild = await categoryRepository.findOne({
        where: {
          name: childName,
          parent: { id: parentCategory.id },
        },
        relations: ['parent'],
      });

      if (!existingChild) {
        const childCategory = categoryRepository.create({
          name: childName,
          parent: parentCategory,
        });

        await categoryRepository.save(childCategory);
      }
    }
  }

  console.log('✅ Categories seeded successfully');
}

async function seed() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    await seedCategories(AppDataSource);

    console.log('Seeding finished');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    console.log('Database connection closed');
  }
}

seed();
