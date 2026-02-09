import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';

import { appConfig } from './config/app.config';
import { dbConfig, TDBConfig } from './config/db.config';

@Module({
  imports: [
    // ✅ Config глобально
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev.example',
      load: [appConfig, dbConfig],
    }),

    // ✅ JWT глобально + async + config
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
          ) as StringValue,
        },
      }),
    }),

    // ✅ TypeORM
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
