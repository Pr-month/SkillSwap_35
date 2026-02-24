import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersData } from './users.data';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  for (const userData of UsersData) {
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = userRepository.create({
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    });

    await userRepository.save(user);
  }

  console.log('✅ Users seeded successfully');
}
