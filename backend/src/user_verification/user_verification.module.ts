import { Module } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';
import { DrizzleModule } from '@src/drizzle/drizzle.module';
import { MailModule } from '@src/mail/mail.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';

@Module({
    imports: [DrizzleModule, MailModule, RedisCacheModule],
    // controllers: [UserVerificationService],
    providers: [UserVerificationService]
})
export class UserVerificationModule { }
