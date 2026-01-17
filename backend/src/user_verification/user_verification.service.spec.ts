import { Test, TestingModule } from '@nestjs/testing';
import { UserVerificationService } from './user_verification.service';

describe('UserVerificationService', () => {
  let service: UserVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserVerificationService],
    }).compile();

    service = module.get<UserVerificationService>(UserVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
