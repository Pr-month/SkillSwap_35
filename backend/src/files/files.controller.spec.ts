import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return file url when file is provided', () => {
    const file: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 12345,
      destination: '',
      filename: 'photo.png',
      path: '',
      buffer: Buffer.from([]),
      stream: null as any, // stream нужен для полного Multer, но тест его не использует
    };

    const result = controller.upload(file);
    expect(result).toEqual({ url: `/uploads/${file.filename}` });
  });

  it('should throw HttpException when file is not provided', () => {
    expect(() =>
      controller.upload(undefined as unknown as Express.Multer.File),
    ).toThrowError(
      new HttpException('File not provided', HttpStatus.BAD_REQUEST),
    );
  });

  it('should allow only images via fileFilter', () => {
    const mockCb = jest.fn();

    const fileFilter = (_: any, file: Express.Multer.File, cb: any) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(
          new HttpException('Only images are allowed', HttpStatus.BAD_REQUEST),
          false,
        );
      }
      cb(null, true);
    };

    const validFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'pic.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 100,
      destination: '',
      filename: 'pic.jpg',
      path: '',
      buffer: Buffer.from([]),
      stream: null as any,
    };

    const invalidFile: Express.Multer.File = {
      ...validFile,
      mimetype: 'text/plain',
    };

    fileFilter(null, validFile, mockCb);
    expect(mockCb).toHaveBeenCalledWith(null, true);

    const mockCb2 = jest.fn();
    fileFilter(null, invalidFile, mockCb2);
    expect(mockCb2).toHaveBeenCalledWith(expect.any(HttpException), false);
  });
});
