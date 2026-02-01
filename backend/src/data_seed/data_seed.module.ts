import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from 'src/aws-services/aws-services.module';
import { AwsServicesService } from 'src/aws-services/aws-services.service';
import { ImageService } from 'src/image/image.service';
import { RedisCacheModule } from 'src/redis_cache/redis_cache.module';
import { UserService } from 'src/user/user.service';

@Module({
    imports: [RedisCacheModule, HttpModule, AwsServicesModule],
    providers: [ImageService, AwsServicesService, UserService]
})
export class DataSeedModule { }
