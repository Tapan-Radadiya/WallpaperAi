import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { StripeModule } from '@src/stripe/stripe.module';
import { UserModule } from '@src/user/user.module';

@Module({
  imports: [RedisCacheModule, AwsServicesModule, StripeModule, UserModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService]
})
export class ImageModule { }
