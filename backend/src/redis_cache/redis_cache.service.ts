import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis_cache.module';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis
    ) { }

    async getRedisKeyValue(key: string) {
        return this.redisClient.get(key)
    }

    async setRedistKey(key: string, data: any, ttl: number) {
        this.redisClient.set(key, data, 'EX', ttl)
    }


    async onModuleDestory() {
        await this.redisClient.quit()
    }
}
