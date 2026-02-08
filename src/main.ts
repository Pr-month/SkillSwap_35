import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { AppModule } from './app.module';
import { appConfig, TAppConfig } from './config/app.config';
import { seedAdmin } from './seeds/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );
  await seedAdmin();
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalFilters(
    new MulterExceptionFilter(),
    new AllExceptionFilter(),
  );
  const appConfigData = app.get<TAppConfig>(appConfig.KEY);
  await app.listen(appConfigData.port);
}

void bootstrap();
