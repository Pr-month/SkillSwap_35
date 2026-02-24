import { Controller, Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { GetCitiesDto } from './dto/cities.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  findAll(@Query() query: GetCitiesDto) {
    return this.citiesService.findAll(query);
  }
}
