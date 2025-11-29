import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
    private readonly redisClient: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redisClient = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
        });
    }

    async getRedisKeyValue(key: string): Promise<string> {
        return await this.redisClient.get(key) || '';
    }

    async setRedistKey(key: string, data: string, ttl: number): Promise<void> {
        await this.redisClient.set(key, data, 'EX', ttl);
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    async invalidateCache(key: string, data: string, ttl: number) {
        await this.redisClient.del(key)
        await this.setRedistKey(key, data, ttl)
    }
}

