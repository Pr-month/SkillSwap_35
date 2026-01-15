import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    JwtModule.register({
      global: true, // JWT подключён глобально
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
