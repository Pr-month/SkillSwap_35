import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
<<<<<<< Updated upstream
=======
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
>>>>>>> Stashed changes

@Module({
  imports: [
    JwtModule.register({
<<<<<<< Updated upstream
      global: true, // ✅ JWT подключён глобально
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
=======
      global: true,
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev.example',
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'skillswap'),
        synchronize: configService.get('DB_SYNCHRONIZE', false),
        logging: configService.get('DB_LOGGING', true),
      }),
    }),
>>>>>>> Stashed changes
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
