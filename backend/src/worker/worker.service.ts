import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { catchError, lastValueFrom } from 'rxjs';
import { APIResponse } from 'src/utils/common';

@Injectable()
export class WorkerService {
    private readonly logger = new Logger(WorkerService.name)

    constructor(
        private readonly redis: RedisCacheService,
        private readonly httpService: HttpService
    ) { }
    private ImagePages = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

    @Cron(CronExpression.EVERY_12_HOURS)
    async invalidateCache() {
        this.logger.log('Invalidating Cache');
        for (let i = 0; i < this.ImagePages.length; i++) {
            await this.getUnsplashimage(this.ImagePages[i] as '100' | '200')
        }
        this.logger.log('New images dumped');
    }

    async getUnsplashimage(pages: '100' | '200' | '300' | '400' | '500') {
        const unSplashimages = await lastValueFrom(this.httpService.get(`https://api.unsplash.com/photos/random?count=${pages}`, {
            headers: {
                Authorization: `${process.env.SPLASH_API_KEY}`
            }
        }).pipe(catchError(async (error) => {
            throw APIResponse({ statusCode: HttpStatus.CONFLICT, message: "SplashApi Call Failed" })
        })))

        await this.validateTheUnsplashImages(unSplashimages.data, pages)
    }

    async validateTheUnsplashImages(unSplashimages, pages: '100' | '200' | '300' | '400' | '500') {
        if (Array.isArray(unSplashimages)) {
            const updatedImageObj = unSplashimages?.map((ele) => {
                return {
                    source: 'Unsplash',
                    id: ele.id,
                    width: 123,
                    height: 321,
                    imageUrl: {
                        small: ele.urls.thumb,
                        large: ele.urls.full,
                        regular: ele.urls.regular,
                        downloadable: ele.urls.regular
                    },
                    alt_text: ele.alt_description,
                    description: ele.description ?? '',
                    created_at: ele.created_at
                }
            })
            await this.redis.invalidateCache(`page_${pages}`, JSON.stringify(updatedImageObj), 510)
        }
    }
}