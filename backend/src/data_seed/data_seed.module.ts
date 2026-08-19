import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AwsServicesModule } from '@src/aws-services/aws-services.module';
import { LangchainModule } from '@src/langchain/langchain.module';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { WorkerModule } from '@src/worker/worker.module';

@Module({
    imports: [RedisCacheModule, HttpModule, AwsServicesModule, LangchainModule, AwsServicesModule, WorkerModule],
    providers: []
})
export class DataSeedModule { }
