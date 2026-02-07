import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response, Request } from 'express';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { TAuthRequest } from './types/auth.types';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.register(registerDto, res);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response, @Req() req: TAuthRequest) {
    return this.authService.logout(req, res);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Res({ passthrough: true }) res: Response, @Req() req: TAuthRequest) {
    return this.authService.refresh(req, res);
  }
}
