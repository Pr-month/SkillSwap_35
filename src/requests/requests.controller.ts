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
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { TAuthRequest } from '../auth/types/auth.types';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // Создание заявки (только авторизованный пользователь)
  @UseGuards(AccessTokenGuard)
  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: TAuthRequest,
  ) {
    return this.requestsService.create(
      createRequestDto,
      req.user.sub,
    );
  }

  // Получение входящих заявок (где мы получатель)
  @UseGuards(AccessTokenGuard)
  @Get('incoming')
  getIncoming(@Req() req: TAuthRequest) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  // Получение исходящих заявок (где мы отправитель)
  @UseGuards(AccessTokenGuard)
  @Get('outgoing')
  getOutgoing(@Req() req: TAuthRequest) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  // Ниже — сгенерированные методы, НЕ ТРОГАЕМ

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    return this.requestsService.update(+id, updateRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}
