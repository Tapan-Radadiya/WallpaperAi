import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { RedisCacheModule } from 'src/redis_cache/redis_cache.module';
import { HttpModule } from '@nestjs/axios';
import { UserService } from 'src/user/user.service';
import { AwsServicesService } from 'src/aws-services/aws-services.service';
import { AwsServicesModule } from 'src/aws-services/aws-services.module';

@Module({
  imports: [RedisCacheModule, HttpModule, AwsServicesModule],
  controllers: [ImageController],
  providers: [ImageService, AwsServicesService, UserService],
  exports: [ImageService, ImageModule]
})
export class ImageModule { }
