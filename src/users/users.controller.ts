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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { TAuthRequest } from 'src/auth/types/auth.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Создание пользователя — доступно без токена
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Получение всех пользователей — доступ только для админа
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Смена пароля текущего пользователя — доступ для авторизованного пользователя
  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  changePassword(
    @Req() req: TAuthRequest,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  // Получение информации о текущем пользователе
  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getMe(@Req() req: TAuthRequest) {
    return this.usersService.findCurrentUser(req.user.sub);
  }

  // Обновление текущего пользователя
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  async updateMe(
    @Req() req: TAuthRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateCurrentUser(req.user.sub, updateUserDto);
  }

  // Получение пользователя по ID — доступ только для админа
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Обновление пользователя по ID — доступ только для админа
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Удаление пользователя — доступ только для админа
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Пример эндпоинта только для админов
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-panel')
  getAdminPanel() {
    return { message: 'Доступ только для админа' };
  }
}
