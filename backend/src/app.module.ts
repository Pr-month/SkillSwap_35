import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { RequestsModule } from './requests/requests.module';

import { appConfig } from './config/app.config';
import { dbConfig, TDBConfig } from './config/db.config';
import { jwtConfig, TJwtConfig } from './config/jwt.config';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? '.env.test.local'
          : '.env.local',
      load: [appConfig, dbConfig, jwtConfig],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [jwtConfig.KEY],
      useFactory: (config: TJwtConfig) => ({
        secret: config.secret,
        signOptions: {
          expiresIn: config.expiresIn as StringValue,
        },
      }),
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
    FilesModule,
    SkillsModule,
    RequestsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
