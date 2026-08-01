import { Module } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';
import { UserVerificationController } from './user_verification.controller';
import { MailModule } from '@src/mail/mail.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { DrizzleModule } from '@src/drizzle/drizzle.module';

@Module({
    imports: [DrizzleModule, MailModule, RedisCacheModule],
    controllers: [UserVerificationController],
    providers: [UserVerificationService],
    exports: [UserVerificationService]
})
export class UserVerificationModule { }
