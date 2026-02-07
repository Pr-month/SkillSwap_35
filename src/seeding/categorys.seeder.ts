import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './categories.data';

export async function seedCategories(dataSource: DataSource) {
  const categoryRepository = dataSource.getRepository(Category);

  for (const parentCategoryData of CategoriesData) {
    // Проверяем, существует ли родительская категория
    let parentCategory = await categoryRepository.findOne({
      where: { name: parentCategoryData.name },
    });

    // Если нет — создаём
    if (!parentCategory) {
      parentCategory = categoryRepository.create({
        name: parentCategoryData.name,
      });

      parentCategory = await categoryRepository.save(parentCategory);
    }

    // Создаём подкатегории
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
