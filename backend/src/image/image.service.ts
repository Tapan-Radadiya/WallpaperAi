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


    async getImages() {
        const data = await this.redis.getRedisKeyValue('test')

        const splashImages = await lastValueFrom(this.httpService.get(`https://api.unsplash.com/photos/random?count=10`, {
            headers: {
                Authorization: `${process.env.SPLASH_API_KEY}`
            }
        }).pipe(catchError(async (error) => {
            throw APIResponse({ statusCode: HttpStatus.CONFLICT, message: "SplashApi Call Failed" })
        })))

        let imageData = []

        if (splashImages.data) {
            imageData = splashImages.data.map((ele) => {
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
        }
        console.log('imageData-->', imageData);
        if (!data) {
            const userDataTest = {
                name: "Tapan",
                crush: "Peril",
                willMarry: "God knows"
            }
            await this.redis.setRedistKey('test', JSON.stringify(userDataTest), 60)
            return APIResponse({ statusCode: HttpStatus.OK, message: "Redis Key Set", data: userDataTest })
        } else {
            return APIResponse({ statusCode: HttpStatus.OK, message: "Redis Key Data", data: JSON.parse(data) })
        }
    }
}
