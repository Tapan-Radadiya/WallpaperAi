import { Test, TestingModule } from '@nestjs/testing';
import { UserVerificationController } from './user_verification.controller';

describe('UserVerificationController', () => {
  let controller: UserVerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVerificationController],
    }).compile();

    controller = module.get<UserVerificationController>(UserVerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
