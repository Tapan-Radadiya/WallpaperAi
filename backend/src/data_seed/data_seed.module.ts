import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { LangchainModule } from '@src/langchain/langchain.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';

@Module({
    imports: [RedisCacheModule, HttpModule, AwsServicesModule, LangchainModule, AwsServicesModule],
    providers: []
})
export class DataSeedModule { }
