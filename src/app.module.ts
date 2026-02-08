import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { dbConfig, TDBConfig } from './config/db.config';
import { FilesModule } from './files/files.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { jwtConfig } from './config/jwt.config';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev.example',
      load: [appConfig, dbConfig, jwtConfig],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
