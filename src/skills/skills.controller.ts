import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) { }

  @Post()
  @UseGuards(AccessTokenGuard)
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.skillsService.update(id, updateSkillDto, userId);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.skillsService.remove(id, userId);
  }

  @Post(':id/favorite')
  @UseGuards(AccessTokenGuard)
  addToFavorites(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.skillsService.addToFavorites(id, userId);
  }

  @Delete(':id/favorite')
  @UseGuards(AccessTokenGuard)
  removeFromFavorites(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.skillsService.removeFromFavorites(id, userId);
  }
}
