import { Module } from '@nestjs/common';
import { NotificationGateway } from './notifications.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@Module({
  providers: [NotificationGateway, WsJwtGuard],
  exports: [NotificationGateway],
})
export class NotificationsModule {}
