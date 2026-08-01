import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DrizzleModule } from '@src/drizzle/drizzle.module';
import { StripeModule } from '@src/stripe/stripe.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';

@Module({
  imports: [DrizzleModule, RedisCacheModule, AwsServicesModule, StripeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule { }