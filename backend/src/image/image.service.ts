import { HttpStatus, Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { APIResponse } from 'src/utils/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom } from 'rxjs';

@Injectable()
export class ImageService {
    constructor(
        private readonly redis: RedisCacheService,
        private readonly httpService: HttpService
    ) { }


    async getImages(page: string) {
        const redisKey = `page_${page}`
        const getData = await this.redis.getRedisKeyValue(redisKey)
        if (!getData) {
            return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Getting Images Try After Some Time" })
        } else {
            const randomData = this.randomizeData(JSON.parse(getData))
            return APIResponse({ statusCode: HttpStatus.OK, message: "Data Fetched", data: randomData })
        }
    }

    randomizeData(data: any[]): any[] {
        const plainData = data
        for (let i = plainData.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));

            [plainData[i], plainData[j]] = [plainData[j], plainData[i]]
        }
        return plainData

    }
}
