import { DataSource } from 'typeorm';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';

export async function seedTestSkills(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const skillRepository = dataSource.getRepository(Skill);

  const users = await userRepository.find();

  if (!users.length) {
    console.log('❌ No users found. Run users seeding first.');
    return;
  }

  for (const user of users) {
    const skillsData = [
      {
        title: 'NestJS Backend',
        description: 'Разработка серверной части на NestJS',
        category: 'IT и программирование',
        images: [],
        owner: user,
      },
      {
        title: 'PostgreSQL',
        description: 'Проектирование и работа с базами данных',
        category: 'IT и программирование',
        images: [],
        owner: user,
      },
    ];

    for (const skillData of skillsData) {
      const existingSkill = await skillRepository.findOne({
        where: {
          title: skillData.title,
          owner: { id: user.id },
        },
        relations: ['owner'],
      });

      if (existingSkill) continue;

      const skill = skillRepository.create(skillData);
      await skillRepository.save(skill);
    }
  }

  console.log('✅ Test skills seeded successfully');
}
