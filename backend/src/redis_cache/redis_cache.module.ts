import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheService } from './redis_cache.service';

@Module({
    imports: [ConfigModule],
    providers: [RedisCacheService],
    exports: [RedisCacheService],
})
export class RedisCacheModule { }


