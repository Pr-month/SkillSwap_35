import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { GetCitiesDto } from './dto/cities.dto';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  async findAll(query: GetCitiesDto) {
    const { search, limit } = query;
    const qb = this.cityRepository.createQueryBuilder('city');

    qb.select(['city.id', 'city.name']);
    if (search && search.trim()) {
      qb.where('city.name ILIKE :search', { search: `%${search.trim()}%` });
    }
    if (limit !== undefined) qb.take(limit);

    return qb.getMany();
  }
}
