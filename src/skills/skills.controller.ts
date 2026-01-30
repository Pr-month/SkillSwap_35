import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { TAuthRequest } from '../auth/types/auth.types';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillsService } from './skills.service';

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

  // @Get()
  // findAll() {
  //   return this.skillsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.skillsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
  //   return this.skillsService.update(+id, updateSkillDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.skillsService.remove(+id);
  // }
}
