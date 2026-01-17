import { Module } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [DrizzleModule, MailModule],
    // controllers: [UserVerificationService],
    providers: [UserVerificationService]
})
export class UserVerificationModule { }
