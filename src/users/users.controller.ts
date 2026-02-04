import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { TAuthRequest } from '../auth/types/auth.types';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  changePassword(@Req() req: TAuthRequest, @Body() dto: UpdateUserPasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  getMe(@Req() req: TAuthRequest) {
    return this.usersService.findCurrentUser(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  updateMe(@Req() req: TAuthRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateCurrentUser(req.user.sub, updateUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
