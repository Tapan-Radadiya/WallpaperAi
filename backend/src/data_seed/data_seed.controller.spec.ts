import { Test, TestingModule } from '@nestjs/testing';
import { DataSeedController } from './data_seed.controller';

describe('DataSeedController', () => {
  let controller: DataSeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataSeedController],
    }).compile();

    controller = module.get<DataSeedController>(DataSeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
