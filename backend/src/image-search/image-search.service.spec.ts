import { Test, TestingModule } from '@nestjs/testing';
import { ImageSearchService } from './image-search.service';

describe('ImageSearchService', () => {
  let service: ImageSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageSearchService],
    }).compile();

    service = module.get<ImageSearchService>(ImageSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
