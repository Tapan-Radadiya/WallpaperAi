import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { APIResponse } from 'src/utils/common';
import * as schema from "../Schema/schema";
import { APIResponseInterface } from 'src/types/common.types';
import { ImageUploadBodyDTO, ImageUploadDTO, LikeImageDTO } from 'src/DTO/image.dto';
import sharp from 'sharp';
import { FileuploadService } from 'src/fileupload/fileupload.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ImageService {
    private readonly PAGE_LENGTH = 100
    private readonly DEFAULT_TTL_IMAGE = 10000
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly httpService: HttpService,
        private readonly uploadService: FileuploadService,
        private readonly userService: UserService
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

        try {
            const newData = await this.conn
                .select({
                    id: schema.tbl_image.id,
                    rawUrl: schema.tbl_image.raw_url,
                    thumbnailUrl: schema.tbl_image.thumbnail_url,
                    width: schema.tbl_image.width,
                    height: schema.tbl_image.height,
                    description: schema.tbl_image.description,
                    userName: schema.tbl_user.display_name,
                    userAvatar: schema.tbl_user.avatar,
                    userId: schema.tbl_user.id
                })
                .from(schema.tbl_image)
                .leftJoin(
                    schema.tbl_user,
                    eq(schema.tbl_user.id, schema.tbl_image.user_id)
                )
                .offset(offset)
                .limit(this.PAGE_LENGTH)


            const updatedData = newData.map((ele) => {
                return {
                    ...ele,
                    rawUrl: `${process.env.AWS_CLOUDFRONT}${ele.rawUrl}`,
                    thumbnailUrl: `${process.env.AWS_CLOUDFRONT}${ele.thumbnailUrl}`,
                    userAvatar: `${process.env.AWS_CLOUDFRONT}${ele.userAvatar}`
                }
            })
            // cache new req for other users 
            await this.redis.setRedisKey(redisKey, JSON.stringify(updatedData), this.DEFAULT_TTL_IMAGE)
            return APIResponse({ statusCode: HttpStatus.OK, message: "", data: updatedData })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error", err: error })
        }

    }

    async uploadUserImageService(reqBody: ImageUploadBodyDTO, imageMetaData: sharp.Metadata, userId: string, fileData: Express.Multer.File): Promise<APIResponseInterface> {
        const imageUuid = crypto.randomUUID()
        const imageThumbnailPath = `images/${userId}/${imageUuid}/thumbnail.webp`
        const imageRawPath = `images/${userId}/${imageUuid}/raw.${imageMetaData.format}`
        const imageFullPath = `images/${userId}/${imageUuid}/preview.webp`
        try {
            const thumbnailbuffer = await this.convertImageToThumbnail(fileData, { width: imageMetaData.width, height: imageMetaData.height })
            const fullImageBuffer = await this.convertImageToPreview(fileData)

            const data = await Promise.allSettled([
                this.uploadService.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
                this.uploadService.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
                this.uploadService.uploadFile(imageFullPath, fullImageBuffer, fileData.mimetype)
            ])

            const imageData: ImageUploadDTO = {
                id: imageUuid,
                category: reqBody.category,
                description: reqBody.description,
                hashTags: reqBody.hashTags,
                height: imageMetaData.height,
                width: Math.round(imageMetaData.width),
                is_paid: reqBody.is_paid,
                user_id: userId,
                raw_url: imageRawPath,
                thumbnail_url: imageThumbnailPath,
                title: reqBody.title
            }

            const insertImage = await this.conn.insert(schema.tbl_image).values({
                description: imageData.description,
                category: imageData.category,
                hashTags: imageData.hashTags,
                height: imageData.height,
                raw_url: imageData.raw_url,
                thumbnail_url: imageData.thumbnail_url,
                user_id: imageData.user_id,
                width: imageData.width,
                id: imageData.id,
                is_paid: imageData.is_paid,
                title: imageData.title
            })

            if (insertImage) {
                return APIResponse({ statusCode: HttpStatus.CREATED, message: 'Image uploaded' })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: 'Error uploading image' })
            }
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Something Went Wrong", err: error })
        }
    }

    async imageLike(userId: string, body: LikeImageDTO): Promise<APIResponseInterface> {
        try {
            const isImageExists = await this.getLikeImage(body.imageId, userId)

            if (!isImageExists) {
                await this.conn.insert(schema.tbl_image_likes).values({
                    image_id: body.imageId,
                    user_id: userId
                })
                await this.redis.destroyKey(`profileData_${userId}`)
                return APIResponse({ statusCode: HttpStatus.OK, message: "Liked" })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Operation" })
            }

        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error" })
        }
    }


    async unlikeImage(userId: string, body: LikeImageDTO): Promise<APIResponseInterface> {
        try {
            const isImageExists = await this.getLikeImage(body.imageId, userId)

            if (!isImageExists) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Operation" })
            } else {
                await this.conn.delete(schema.tbl_image_likes).where(
                    and(
                        eq(schema.tbl_image_likes.user_id, userId),
                        eq(schema.tbl_image_likes.image_id, body.imageId)
                    )
                )
                await this.redis.destroyKey(`profileData_${userId}`)
                return APIResponse({ statusCode: HttpStatus.OK, message: "UnLiked" })
            }

        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error" })
        }
    }


    async getAllLikedImages(userId: string): Promise<APIResponseInterface> {
        const { data } = await this.userService.getUserLikedImages(userId)
        const likedImageIds: string[] = []
        if (Array.isArray(data.likedImages) && data.likedImages.length > 0) {
            for (const element of data.likedImages) {
                likedImageIds.push(element.image_id)
            }
        }
        return APIResponse({ statusCode: HttpStatus.OK, message: "Data Fetched", data: likedImageIds })
    }

    async getImageDetails(imageId: string): Promise<APIResponseInterface> {
        try {
            const isImageExists = await this.conn.query.tbl_image.findFirst({
                where: (
                    eq(
                        schema.tbl_image.id, imageId
                    )
                )
            })

            if (!isImageExists) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "Unable to find the image" })
            }


            const totalLikedImage = await this.conn
                .select({
                    totalLike: count()
                })
                .from(schema.tbl_image_likes)
                .where(
                    eq(schema.tbl_image_likes.image_id, imageId)
                )
            const imageData = {
                ...isImageExists,
                imageLikes: totalLikedImage[0].totalLike
            }

            return APIResponse({ statusCode: HttpStatus.OK, message: "Ok", data: imageData })
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }


    // Private Functions
    private async getLikeImage(imageId: string, userId: string) {
        return await this.conn.query.tbl_image_likes.findFirst({
            where: (
                and(
                    eq(schema.tbl_image_likes.image_id, imageId),
                    eq(schema.tbl_image_likes.user_id, userId)
                )
            )
        })
    }

    private async convertImageToThumbnail(imageData: Express.Multer.File, orgImage: { width: number, height: number }): Promise<Buffer> {
        const thumbnailImageWidth = Math.round((orgImage.height / orgImage.width) * 400)

        const thumbNailImage = await sharp(imageData.buffer).resize({ width: thumbnailImageWidth }).toBuffer()
        return thumbNailImage
    }

    private async convertImageToPreview(imageData: Express.Multer.File): Promise<Buffer> {
        const previewWidth = 1400; // perfect for modal previews
        const previewImage = await sharp(imageData.buffer)
            .resize({ width: previewWidth, withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();

        return previewImage;
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
