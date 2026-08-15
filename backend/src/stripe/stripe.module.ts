import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';

@Module({
  imports: [RedisCacheModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService]
})
export class StripeModule { }
