import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { catchError, lastValueFrom } from 'rxjs';
import { APIResponse } from 'src/utils/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "../Schema/schema"
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import json from "../../test.json"
@Injectable()
export class WorkerService {
    private readonly logger = new Logger(WorkerService.name)

    constructor(
        private readonly redis: RedisCacheService,
        private readonly httpService: HttpService,
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>
    ) { }
    private ImagePages = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

    private insertedImageCount = 0
    private newUserCount = 0

    @Cron(CronExpression.EVERY_10_SECONDS)
    async invalidateCache() {
        this.logger.log('Invalidating Cache');
        if (!this.conn) {
            return
        }
        for (let i = 0; i < this.ImagePages.length; i++) {
            await this.getUnsplashimage(this.ImagePages[i] as '100' | '200')
        }
        this.logger.log(`Total New Images Dumped: ${this.insertedImageCount} \n New Users Added: ${this.newUserCount}`);
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
        // await this.validateTheUnsplashImages(json, pages)
    }

    async validateTheUnsplashImages(unSplashimages, pages: '100' | '200' | '300' | '400' | '500') {
        if (Array.isArray(unSplashimages)) {
            const updatedImageObj = unSplashimages?.map((ele) => {
                return {
                    source: 'Unsplash',
                    id: ele.id,
                    width: ele.width,
                    height: ele.height,
                    imageUrl: ele.urls,
                    alt_text: ele.alt_description ?? 'TEST_ALT',
                    description: ele.description ?? 'TEST_DESC',
                    created_at: ele.created_at,
                    user: ele.user
                }
            })


            for (let i = 0; i < updatedImageObj.length; i++) {
                await this.insertUnsplashImageData(updatedImageObj[i])
            }
            // await this.redis.invalidateCache(`page_${pages}`, JSON.stringify(updatedImageObj), 51000)
        }
    }

    private async insertUnsplashImageData(unsplashData) {
        const isUserExists = await this.conn.query.tbl_unsplash_users.findFirst({
            where: eq(schema.tbl_unsplash_users.unsplash_user_id, unsplashData.user.id)
        })
        if (!isUserExists) {
            const userData = unsplashData.user
            const user = await this.conn.insert(schema.tbl_unsplash_users).values({
                name: userData.name,
                portfolio_url: userData?.portfolio_url ?? userData.profile_image.medium ?? 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Ffree-photos-vectors%2Fman-avatar&psig=AOvVaw2d3g3s1tSU7MB3fHCuZL9q&ust=1765204357667000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJCb6_XYq5EDFQAAAAAdAAAAABAL',
                unsplash_user_id: userData.id,
                userName: userData.username
            }).returning({
                unsplash_user_id: schema.tbl_unsplash_users.unsplash_user_id
            })
            if (user) {
                this.newUserCount = this.newUserCount++
            }
            await this.insertUnsplashImage(unsplashData, user[0])
        } else {
            await this.insertUnsplashImage(unsplashData, isUserExists)
        }
    }

    private async insertUnsplashImage(unsplashData, user) {
        const isImageExists = await this.conn.query.tbl_unsplash_images.findFirst({
            where: eq(schema.tbl_unsplash_images.unsplash_id, unsplashData.id)
        })
        if (!isImageExists) {
            const insertedImage = await this.conn.insert(schema.tbl_unsplash_images).values({
                alt_text: unsplashData.alt_text,
                created_at: new Date(unsplashData.created_at),
                description: unsplashData.description,
                image_height: unsplashData.height,
                image_width: unsplashData.width,
                unsplash_id: unsplashData.id,
                unsplash_user_id: user.unsplash_user_id,
                image_urls: unsplashData.imageUrl
            })
            if (insertedImage) {
                this.insertedImageCount = this.insertedImageCount++
            }
        }
    }
}