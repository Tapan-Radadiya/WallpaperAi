import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { UserService } from '@src/user/user.service';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { LoggingService } from '@src/logging/logging.service';

@Module({
  imports: [RedisCacheModule, HttpModule, AwsServicesModule],
  controllers: [ImageController],
  providers: [ImageService, AwsServicesService, UserService, LoggingService],
  exports: [ImageService, ImageModule]
})
export class ImageModule { }
