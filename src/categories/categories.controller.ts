import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UserRole } from '../users/enums/user.enums';
import { TAuthRequest } from '../auth/types/auth.types';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: TAuthRequest, @Body() dto: CreateCategoryDto) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.categoriesService.create(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(
    @Req() req: TAuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.categoriesService.update(id, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Req() req: TAuthRequest, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.categoriesService.remove(id);
  }
}
