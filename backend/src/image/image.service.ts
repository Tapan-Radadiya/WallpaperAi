import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { APIResponse } from 'src/utils/common';
import * as schema from "../Schema/schema";
import { APIResponseInterface } from 'src/types/common.types';

@Injectable()
export class ImageService {
    private readonly PAGE_LENGTH = 100
    private readonly DEFAULT_TTL_IMAGE = 10000
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly httpService: HttpService,
    ) { }


    async getImages(page: string): Promise<APIResponseInterface> {
        const redisKey = `page_${page}`
        const offset = parseInt(page) * this.PAGE_LENGTH

        const isKeyExists = await this.redis.isKeyExists(redisKey)
        if (isKeyExists) {
            const getData = await this.redis.getRedisKeyValue(redisKey)
            const randomData = this.randomizeData(JSON.parse(getData))
            return APIResponse({ statusCode: HttpStatus.OK, message: "Cached Data", data: randomData })
        }
        const data = await this.conn
            .select({
                id: schema.tbl_unsplash_images.id,
                imageUrl: schema.tbl_unsplash_images.image_urls,
                width: schema.tbl_unsplash_images.image_width,
                height: schema.tbl_unsplash_images.image_height,
                alt_text: schema.tbl_unsplash_images.alt_text,
                description: schema.tbl_unsplash_images.description,
                userName: schema.tbl_unsplash_users.userName,
                userAvatar: schema.tbl_unsplash_users.portfolio_url,
                userId: schema.tbl_unsplash_users.id
            })
            .from(schema.tbl_unsplash_images)
            .leftJoin(
                schema.tbl_unsplash_users,
                eq(schema.tbl_unsplash_images.unsplash_user_id, schema.tbl_unsplash_users.unsplash_user_id)
            )
            .offset(offset)
            .limit(this.PAGE_LENGTH)

        // cache new req for other users 
        await this.redis.setRedisKey(redisKey, JSON.stringify(data), this.DEFAULT_TTL_IMAGE)
        return APIResponse({ statusCode: HttpStatus.OK, message: "", data: data })

        // if (!getData) {
        //     return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Getting Images Try After Some Time" })
        // } else {
        //     const randomData = this.randomizeData(JSON.parse(getData))
        //     return APIResponse({ statusCode: HttpStatus.OK, message: "Data Fetched", data: randomData })
        // }
    }

    private randomizeData(data: any[]): any[] {
        const plainData = data
        for (let i = plainData.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));

            [plainData[i], plainData[j]] = [plainData[j], plainData[i]]
        }
        return plainData

    }
}
