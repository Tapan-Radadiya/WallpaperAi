import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { RedisCacheModule } from 'src/redis_cache/redis_cache.module';
import { HttpModule } from '@nestjs/axios';
import { FileuploadService } from 'src/fileupload/fileupload.service';
@Module({
  imports: [RedisCacheModule, HttpModule],
  controllers: [ImageController],
  providers: [ImageService, FileuploadService]
})
export class ImageModule { }
