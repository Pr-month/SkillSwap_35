import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { FilesController } from '../src/files/files.controller';
import * as fs from 'fs';
import * as path from 'path';

describe('FilesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [FilesController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/upload (POST) - should upload an image and return URL', async () => {
    const testImagePath = path.join(__dirname, 'test.png');

    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, '');
    }

    const res = await request(app.getHttpServer())
      .post('/upload')
      .attach('image', testImagePath);

    expect(res.status).toBe(HttpStatus.CREATED || 201);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toMatch(/\/uploads\/.+\.png$/);
  });

  it('/upload (POST) - should reject non-image files', async () => {
    const testTxtPath = path.join(__dirname, 'test.txt');
    if (!fs.existsSync(testTxtPath)) {
      fs.writeFileSync(testTxtPath, 'hello world');
    }

    const res = await request(app.getHttpServer())
      .post('/upload')
      .attach('image', testTxtPath);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.message).toBe('Only images are allowed');
  });

  it('/upload (POST) - should fail when no file provided', async () => {
    const res = await request(app.getHttpServer()).post('/upload');

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.message).toBe('File not provided');
  });
});
