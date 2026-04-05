import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { ImageService } from '@src/image/image.service';
import { LangchainModule } from '@src/langchain/langchain.module';
import { LangchainService } from '@src/langchain/langchain.service';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { UserService } from '@src/user/user.service';

@Module({
    imports: [RedisCacheModule, HttpModule, AwsServicesModule, LangchainModule, AwsServicesModule],
    providers: [ImageService, UserService, LangchainService]
})
export class DataSeedModule { }
