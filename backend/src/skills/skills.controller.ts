import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { TAuthRequest } from '../auth/types/auth.types';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillQueryDto } from './dto/skill-query.dto';
import { SkillsService } from './skills.service';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  async create(
    @Body() createSkillDto: CreateSkillDto,
    @Req() req: TAuthRequest,
  ) {
    const userId = req.user.sub;
    return await this.skillsService.create(createSkillDto, userId);
  }

  @Get()
  async findAll(@Query() query: SkillQueryDto) {
    return await this.skillsService.findAll(query);
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
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.skillsService.remove(id, userId);
  }

  @Post(':id/favorite')
  @UseGuards(AccessTokenGuard)
  addToFavorites(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.skillsService.addToFavorites(id, userId);
  }

  @Delete(':id/favorite')
  @UseGuards(AccessTokenGuard)
  removeFromFavorites(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.skillsService.removeFromFavorites(id, userId);
  }
}
