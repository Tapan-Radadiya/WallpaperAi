import { Test, TestingModule } from '@nestjs/testing';
import { ImageSearchController } from './image-search.controller';

describe('ImageSearchController', () => {
  let controller: ImageSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageSearchController],
    }).compile();

    controller = module.get<ImageSearchController>(ImageSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
