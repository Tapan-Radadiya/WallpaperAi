import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisCacheService } from '@src/redis_cache/redis_cache.service';
import { UserVerificationModule } from '@src/user_verification/user_verification.module';
import { UserVerificationService } from '@src/user_verification/user_verification.service';
import { MailService } from '@src/mail/mail.service';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { DrizzleModule } from '@src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule, AwsServicesModule, UserVerificationModule],
  controllers: [AuthController],
  providers: [AuthService, RedisCacheService, UserVerificationService, MailService]
})
export class AuthModule { }
