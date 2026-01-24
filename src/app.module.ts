import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    JwtModule.register({
      global: true, // ✅ JWT подключён глобально
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev.example',
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [dbConfig.KEY],
      useFactory: (dbConfig: TDBConfig) => ({
        ...dbConfig,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
