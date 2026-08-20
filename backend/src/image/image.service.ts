import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { DRIZZLE } from '@src/constants';
import { ImageUploadBodyDTO, ImageUploadDTO, LikeImageDTO } from '@src/DTO/image.dto';
import { RedisCacheService } from '@src/redis_cache/redis_cache.service';
import { APIResponseInterface } from '@src/types/common.types';
import { UserService } from '@src/user/user.service';
import { APIResponse, getImagepaths, getUserProfileDataCacheKey } from '@src/utils/common';
import { UUID } from 'crypto';
import { and, count, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import sharp from 'sharp';
import * as schema from "../Schema/schema";
import { StripeService } from '@src/stripe/stripe.service';

@Injectable()
export class ImageService {
    private readonly PAGE_LENGTH = 100
    private readonly DEFAULT_TTL_IMAGE = 10000
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly awsServices: AwsServicesService,
        private readonly userService: UserService,
        private readonly stripeService: StripeService
    ) { }

    async getImages(page: string): Promise<APIResponseInterface> {
        const redisKey = `page_${page}`
        const offset = parseInt(page) * this.PAGE_LENGTH

        // const isKeyExists = await this.redis.isKeyExists(redisKey)
        // if (isKeyExists) {
        //     const getData = await this.redis.getRedisKeyValue(redisKey)
        //     const randomData = this.randomizeData(JSON.parse(getData))
        //     return APIResponse({ statusCode: HttpStatus.OK, message: "Cached Data", data: randomData })
        // }

        const showPaidImages = process.env.SHOW_PREMIUM_IMAGE === 'true' ? true : false
        try {
            const newData = await this.conn
                .select({
                    id: schema.tbl_image.id,
                    rawUrl: schema.tbl_image.raw_url,
                    thumbnailUrl: schema.tbl_image.is_paid ? schema.tbl_image.waterMarked_thumbnail_url : schema.tbl_image.thumbnail_url,
                    waterMarked_preview_url: schema.tbl_image.waterMarked_preview_url,
                    width: schema.tbl_image.width,
                    height: schema.tbl_image.height,
                    description: schema.tbl_image.description,
                    title: schema.tbl_image.title,
                    is_paid: schema.tbl_image.is_paid,
                    publishedOn: schema.tbl_image.created_at,
                    preview_url: schema.tbl_image.is_paid ? schema.tbl_image.waterMarked_preview_url : schema.tbl_image.preview_url,
                    ownerData: {
                        userName: schema.tbl_user.user_name,
                        userAvatar: schema.tbl_user.avatar,
                        userId: schema.tbl_user.id,
                    }
                })
                .from(schema.tbl_image)
                .leftJoin(
                    schema.tbl_user,
                    eq(schema.tbl_user.id, schema.tbl_image.user_id)
                )
                .where(
                    !showPaidImages ? eq(schema.tbl_image.is_paid, showPaidImages) : undefined
                )
                .offset(offset)
                .limit(this.PAGE_LENGTH)

            // cache new req for other users 
            // await this.redis.setRedisKey(redisKey, JSON.stringify(updatedData), this.DEFAULT_TTL_IMAGE)
            const randomData = this.randomizeData(newData)
            return APIResponse({ statusCode: HttpStatus.OK, message: "", data: randomData })
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error", err: error })
        }

    }

    async uploadUserImageService(reqBody: ImageUploadBodyDTO, imageMetaData: sharp.Metadata, userId: string, fileData: Express.Multer.File): Promise<APIResponseInterface> {
        const imageUuid = crypto.randomUUID()
        const {
            imagePreviewPath,
            imageRawPath,
            imageThumbnailPath,
            waterMarkedThumbnailPath,
            waterMarkedPreviewPath,
            temp_path
        } = getImagepaths({ is_paid: reqBody.is_paid, imageUuid, userId, format: imageMetaData.format })

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
            preview_url: imagePreviewPath,
            waterMarked_url: waterMarkedPreviewPath,
            waterMarked_thumbnail_url: waterMarkedThumbnailPath,
            title: reqBody.title,
            price: reqBody.price
        }

        await this.awsServices.uploadFile(temp_path, fileData.buffer, fileData.mimetype)

        this.awsServices.sqsImageProcessingDataPush({
            fileData,
            imageSharpMetaData: imageMetaData,
            ImageMetaData: {
                imageFormat: imageMetaData.format,
                userId,
                imageUuid,
                is_image_paid: reqBody.is_paid,
                tempS3Path: temp_path
            }
        })


        return APIResponse({ statusCode: HttpStatus.CREATED, message: 'Image uploaded' })
        try {
            // const thumbnailbuffer = await this.convertImageToThumbnail(fileData, { width: imageMetaData.width, height: imageMetaData.height })
            // const previewImageBuffer = await this.convertImageToPreview(fileData)

            // // TODO - This needs to be go in queue
            // if (reqBody.is_paid) {

            //     const thumbNailMetaData = await this.getImageMetadataFromBuffer(thumbnailbuffer)
            //     const previewImageMetaData = await this.getImageMetadataFromBuffer(previewImageBuffer)


            //     const thumbnailFileData: Express.Multer.File = { ...fileData, buffer: thumbnailbuffer }
            //     const previewFileData: Express.Multer.File = { ...fileData, buffer: previewImageBuffer }


            //     const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbnailFileData, thumbNailMetaData)
            //     const previewWaterMarkedImage = await this.getWatermarkedImage(previewFileData, previewImageMetaData)
            //     // If User uploaded image is premium then create a watermarked image 
            //     // const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbNailMetaData, thumbnailbuffer)
            //     const data = await Promise.allSettled([
            //         this.awsServices.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype),

            //         // TODO: Change Image Buffer TO particular Image E.g. Create buffer for watermarked thumbnail Image
            //         this.awsServices.uploadFile(waterMarkedThumbnailPath!, thumbNailWaterMarkedImage, fileData.mimetype),
            //         this.awsServices.uploadFile(waterMarkedPreviewPath!, previewWaterMarkedImage, fileData.mimetype)
            //     ])

            // }
            // else {
            //     const data = await Promise.allSettled([
            //         this.awsServices.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype)
            //     ])
            // }

            const insertImage = await this.conn.insert(schema.tbl_image).values({
                description: imageData.description,
                category: imageData.category,
                hashTags: imageData.hashTags,
                height: imageData.height,
                preview_url: imageData.preview_url,
                raw_url: imageData.raw_url,
                thumbnail_url: imageData.thumbnail_url,
                waterMarked_preview_url: imageData.waterMarked_url,
                waterMarked_thumbnail_url: imageData.waterMarked_thumbnail_url,
                user_id: imageData.user_id,
                width: imageData.width,
                id: imageData.id,
                is_paid: imageData.is_paid,
                title: imageData.title,
                price: imageData.price
            }).returning({
                image_id: schema.tbl_image.id,
                description: schema.tbl_image.description,
                hashTags: schema.tbl_image.hashTags
            })

            // if (insertImage) {
            //     // this.awsServices.sqsImageEmbeddingProcessingDataPush({
            //     //     description: insertImage[0].description,
            //     //     hashTags: insertImage[0].hashTags ?? '',
            //     //     image_id: insertImage[0].image_id
            //     // })

            //     return APIResponse({ statusCode: HttpStatus.CREATED, message: 'Image uploaded' })
            // } else {
            //     return APIResponse({ statusCode: HttpStatus.CONFLICT, message: 'Error uploading image' })
            // }
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
                await this.redis.destroyKey(getUserProfileDataCacheKey(userId))
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
                await this.redis.destroyKey(getUserProfileDataCacheKey(userId))
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

    async getImageDetails(imageId: string, userId: string | null): Promise<APIResponseInterface> {
        await this.awsServices.getSignedUrl('https://djrp6t1rc7td.cloudfront.net/dev/images/43f82621-722b-4c47-a241-fa0b760de45d/738ec1f2-7096-4f51-90e2-34bd322d80df/premium/raw.png')
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
            if (userId) {
                const userPurchasedImage = await this.stripeService.isUserAlreadyPurached(userId, imageId)
                isImageExists["purchased_image"] = userPurchasedImage
            }


            const totalLikedImage = await this.conn
                .select({
                    totalLike: count()
                })
                .from(schema.tbl_image_likes)
                .where(
                    eq(schema.tbl_image_likes.image_id, imageId)
                )

            const totalDownlaods = await this.conn
                .select({
                    totalDownload: count()
                })
                .from(schema.tbl_image_downloads)
                .where(eq(schema.tbl_image_downloads.image_id, imageId))

            const imageData = {
                ...isImageExists,
                price: isImageExists.price,
                publishedOn: isImageExists.created_at,
                imageLikes: totalLikedImage?.[0]?.totalLike,
                totalDownloads: totalDownlaods?.[0]?.totalDownload ?? 0
            }

            return APIResponse({ statusCode: HttpStatus.OK, message: "Ok", data: imageData })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.UNPROCESSABLE_ENTITY, message: "Unable to process your request try after sometime" })
        }
    }

    async updateDownloadCounter(imageId: string, userIp?: string, userId?: string): Promise<APIResponseInterface> {

        try {
            if (userId) {
                // Is same user downloading image again
                const isUserExists = await this.conn.query.tbl_image_downloads.findFirst({
                    where: (
                        and(
                            eq(
                                schema.tbl_image_downloads.image_id, imageId
                            ),
                            eq(
                                schema.tbl_image_downloads.user_id, userId as UUID
                            )
                        )
                    )
                })
                if (isUserExists) {
                    return APIResponse({ statusCode: HttpStatus.OK, message: "User Has Already Downloaded" })
                } else {
                    await this.conn.insert(schema.tbl_image_downloads).values({
                        image_id: imageId,
                        user_id: userId
                    })
                    return APIResponse({ statusCode: HttpStatus.OK, message: '' })
                }
            }

            // User Is Not LoggedIn
            if (userIp) {
                const isUserDownloaded = await this.conn.query.tbl_image_downloads.findFirst({
                    where: (
                        and(
                            eq(
                                schema.tbl_image_downloads.image_id,
                                imageId
                            ),
                            eq(
                                schema.tbl_image_downloads.user_ip,
                                String(userIp)
                            )
                        )
                    )
                })
                if (isUserDownloaded) {
                    return APIResponse({ statusCode: HttpStatus.OK, message: "User Has Already Downloaded" })
                } else {
                    const data = await this.conn.insert(schema.tbl_image_downloads).values({
                        image_id: imageId,
                        user_ip: userIp
                    }).returning({
                        userIp: schema.tbl_image_downloads.user_ip,
                        userId: schema.tbl_image_downloads.image_id
                    })
                    return APIResponse({ statusCode: HttpStatus.OK, message: '' })
                }
            }
            return APIResponse({ statusCode: HttpStatus.CONFLICT, message: 'Unsable to get userId or userIP' })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal Server Error', err: error })
        }
    }

    async getSigendUrlImage(userId: string, imageId: string): Promise<APIResponseInterface> {
        try {
            const isUserPurchasedImage = await this.conn.query.tbl_purchases.findFirst({
                where: (
                    and(
                        eq(schema.tbl_purchases.image_id, imageId),
                        eq(schema.tbl_purchases.buyer_id, userId)
                    )
                )
            })
            if (!isUserPurchasedImage) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "You haven't purchased for this image" })
            }

            const imageData = await this.conn.query.tbl_image.findFirst({
                where: (eq(schema.tbl_image.id, imageId))
            })

            if (!imageData) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "Image not found" })
            }

            const imageUrl = `${process.env.AWS_CLOUDFRONT}${imageData.raw_url}`
            const sigendUrl = await this.awsServices.getSignedUrl(imageUrl)
            return APIResponse({
                statusCode: HttpStatus.OK, message: "", data: {
                    sigendUrl
                }
            })
        } catch (error) {

            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error processing your request try after some time" })
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
    private randomizeData(data: any[]): any[] {
        const plainData = data
        for (let i = plainData.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));

            [plainData[i], plainData[j]] = [plainData[j], plainData[i]]
        }
        return plainData
    }

}
