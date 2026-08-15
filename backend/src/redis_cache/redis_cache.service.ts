import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { redisClient } from '@src/redis-client/redis-client';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
    private readonly redisClient: RedisClientType;

    constructor() {
        this.redisClient = redisClient
    }

    async getRedisKeyValue(key: string): Promise<string> {
        return await this.redisClient.get(key) || '';
    }

    /**
     * 
     * @param key string
     * @param data string
     * @param ttl number in secconds
     */
    async setRedisKey(key: string, data: string, ttl: number): Promise<void> {
        await this.redisClient.set(key, data, { EX: ttl })
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    async invalidateCache(key: string, data: string, ttl: number) {
        await this.redisClient.del(key)
        await this.setRedisKey(key, data, ttl)
    }

    async destroyKey(key: string) {
        await this.redisClient.del(key)
    }

    async isKeyExists(key: string) {
        return await this.redisClient.exists(key)
    }
}

