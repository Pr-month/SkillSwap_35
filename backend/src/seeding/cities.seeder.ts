import { DataSource } from 'typeorm';
import { City } from '../cities/entities/city.entity';
import { russianCities } from './cities.data';

export async function seedCities(dataSource: DataSource) {
  const repository = dataSource.getRepository(City);

  for (const cityName of russianCities) {
    await repository.save({ name: cityName });
  }
}
