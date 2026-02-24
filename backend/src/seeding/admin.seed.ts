import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../config/db.config';
import { User } from '../users/entities/user.entity';
import { Gender, UserRole } from '../users/enums/user.enums';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env.local' }); // указываем тестовый env

export async function seedAdmin(AppDataSource: DataSource) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⚠️ Администратор уже существует');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminData = {
    name: 'Администратор',
    email: adminEmail,
    password: hashedPassword,
    about: 'Суперпользователь',
    birthdate: new Date('1990-01-01'),
    city: 1,
    gender: Gender.NOT_SPECIFIED,
    avatar: '',
    role: UserRole.ADMIN,
    refreshToken: '',
    skills: [],
    wantToLearn: [],
    favoriteSkills: [],
  };

  const admin = userRepository.create(adminData);
  await userRepository.save(admin);

  console.log('✅ Администратор успешно создан!');
}

// Для Jest — вызываем через setup файл, без process.exit
export async function runSeedAdmin(dataSource: DataSource) {
  try {
    await seedAdmin(dataSource);
  } catch (error) {
    console.error(error);
    throw error; // важно: не process.exit!
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}
