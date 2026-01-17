import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FileuploadModule } from 'src/fileupload/fileupload.module';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { UserVerificationModule } from 'src/user_verification/user_verification.module';
import { UserVerificationService } from 'src/user_verification/user_verification.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [DrizzleModule, FileuploadModule, UserVerificationModule],
  controllers: [AuthController],
  providers: [AuthService, RedisCacheService, UserVerificationService, MailService]
})
export class AuthModule { }
