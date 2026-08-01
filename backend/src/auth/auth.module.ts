import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { DrizzleModule } from '@src/drizzle/drizzle.module';
import { UserVerificationModule } from '@src/user_verification/user_verification.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { MailModule } from '@src/mail/mail.module';

@Module({
  imports: [DrizzleModule, AwsServicesModule, UserVerificationModule, RedisCacheModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule { }
