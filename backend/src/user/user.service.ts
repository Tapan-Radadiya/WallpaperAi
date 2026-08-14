import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE, IMAGE_USER_OWNER_TYPE } from '@src/constants';
import { RedisCacheService } from '@src/redis_cache/redis_cache.service';
import { APIResponseInterface, UpdateUserType } from '@src/types/common.types';
import { APIResponse } from '@src/utils/common';
import * as schema from "../Schema/schema";
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { StripeService } from '@src/stripe/stripe.service';
import { retry } from 'rxjs';

@Injectable()
export class UserService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly awsServices: AwsServicesService,
        private readonly stripeService: StripeService
    ) { }

    private TABLE_USER_ALIAS = alias(schema.tbl_user, 'TABLE_USER_ALIAS')

    async getUserProfile(userId: string): Promise<APIResponseInterface> {
        try {
            const userData = await this.conn.query.tbl_user.findFirst({
                where: eq(schema.tbl_user.id, userId)
            })
            const totalUploads = await this.conn
                .select({
                    uploadedImages: count()
                })
                .from(schema.tbl_image)
                .where(
                    eq(schema.tbl_image.user_id, userId)
                )

            const totalLikesOnUploads = await this.conn
                .select({
                    totalLikesOnUploads: count(schema.tbl_image_likes)
                })
                .from(schema.tbl_image)
                .leftJoin(
                    schema.tbl_image_likes, eq(schema.tbl_image_likes.image_id, schema.tbl_image.id)
                )
                .where(
                    eq(schema.tbl_image.user_id, userId)
                )

            if (userData) {
                const responseData = {
                    id: userData.id,
                    userName: userData.user_name,
                    emailId: userData.email_id,
                    avatarImage: `${process.env.AWS_CLOUDFRONT}${userData.avatar}`,
                    user_bio: userData.user_bio,
                    instagram_id: userData.instagram_id ?? '',
                    portfolio_url: userData.portfolio_url ?? '',
                    is_verified: userData.is_verified,
                    totalUploads: totalUploads[0].uploadedImages,
                    totalLikesOnUploads: totalLikesOnUploads[0].totalLikesOnUploads
                }
                return APIResponse({ statusCode: HttpStatus.OK, message: "", data: responseData })
            } else {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "unable to found user" })
            }
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error validation user try after sometime" })
        }
    }

    async getUserLikedImages(userId: string): Promise<APIResponseInterface> {
        try {
            // Disabled Cache
            // const isRedisDataStored = await this.redis.getRedisKeyValue(`profileData_${userId}`)
            // if (isRedisDataStored) {
            //     return APIResponse({ statusCode: HttpStatus.OK, message: "userdata", data: JSON.parse(isRedisDataStored) })
            // }
            const userImages = await this.conn
                .select({
                    image_id: schema.tbl_image.id,
                    is_paid: schema.tbl_image.is_paid,
                    description: schema.tbl_image.description,
                    width: schema.tbl_image.width,
                    height: schema.tbl_image.height,
                    thumbnail_url: schema.tbl_image.thumbnail_url,
                    raw_url: schema.tbl_image.raw_url,
                    ownerData: {
                        id: this.TABLE_USER_ALIAS.id,
                        avatar: this.TABLE_USER_ALIAS.avatar,
                        userName: this.TABLE_USER_ALIAS.user_name
                    },
                    publishedOn: schema.tbl_image.created_at
                })
                .from(schema.tbl_user)
                .leftJoin(
                    schema.tbl_image_likes,
                    eq(schema.tbl_image_likes.user_id, schema.tbl_user.id)
                )
                .leftJoin(
                    schema.tbl_image,
                    eq(schema.tbl_image_likes.image_id, schema.tbl_image.id)
                )
                .leftJoin(
                    this.TABLE_USER_ALIAS,
                    eq(this.TABLE_USER_ALIAS.id, schema.tbl_image.user_id)
                )
                .where(
                    and(
                        eq(schema.tbl_user.id, userId),
                        isNotNull(schema.tbl_image.id)
                    )
                )

            const userProfile = await this.getUserProfile(userId)

            const structuredData = {
                userProfile: userProfile.data,
                likedImages: userImages
            }

            await this.redis.setRedisKey(`profileData_${userId}`, JSON.stringify(structuredData), 86400)

            return APIResponse({ statusCode: HttpStatus.OK, message: "User data", data: structuredData })

        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error validation user try after sometime" })
        }
    }

    async getUserUploadedImages(userId: string) {
        try {
            const showPaidImages = process.env.SHOW_PREMIUM_IMAGE === 'true' ? true : false
            const userImageData = await this.conn
                .select({
                    title: schema.tbl_image.title,
                    image_id: schema.tbl_image.id,
                    is_paid: schema.tbl_image.is_paid,
                    description: schema.tbl_image.description,
                    width: schema.tbl_image.width,
                    height: schema.tbl_image.height,
                    thumbnail_url: schema.tbl_image.thumbnail_url,
                    raw_url: schema.tbl_image.raw_url,
                    ownerData: {
                        id: schema.tbl_user.id,
                        avatar: schema.tbl_user.avatar,
                        userName: schema.tbl_user.user_name
                    },
                    publishedOn: schema.tbl_image.created_at
                })
                .from(schema.tbl_image)
                .leftJoin(
                    schema.tbl_user,
                    eq(
                        schema.tbl_user.id,
                        schema.tbl_image.user_id
                    )
                )
                .where(
                    and(
                        eq(schema.tbl_user.id, userId),
                        isNotNull(schema.tbl_image.id),
                        !showPaidImages ? eq(schema.tbl_image.is_paid, showPaidImages) : undefined
                    )
                )
            return APIResponse({ statusCode: HttpStatus.OK, message: '', data: userImageData })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error" })
        }

    }

    async isUniqueUser(data: { username: string | undefined, userEmail: string | undefined }): Promise<APIResponseInterface> {
        try {
            if (data?.username) {
                const isUserNameExists = await this.conn.query.tbl_user.findFirst({
                    where: (
                        eq(
                            schema.tbl_user.user_name, data.username
                        )
                    )
                })

                if (isUserNameExists) {
                    return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Username Already Exists", data: { exists: true } })
                } else {
                    return APIResponse({ statusCode: HttpStatus.OK, message: "Unique User", data: { exists: false } })
                }
            }
            if (data?.userEmail) {
                const isUserEmailExists = await this.conn.query.tbl_user.findFirst({
                    where: (
                        eq(
                            schema.tbl_user.email_id, data.userEmail
                        )
                    )
                })

                if (isUserEmailExists) {
                    return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "UserEmail Already Exists", data: { exists: true } })
                } else {
                    return APIResponse({ statusCode: HttpStatus.OK, message: "Unique User", data: { exists: false } })
                }
            }
            throw new Error('Either username or useremail should be provided')
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error", err: error })
        }
    }

    async updateUserData(userId: string, userData: UpdateUserType): Promise<APIResponseInterface> {
        try {
            const updateUser = await this.conn
                .update(schema.tbl_user)
                .set({
                    instagram_id: userData.instagram_id,
                    portfolio_url: userData.portfolio_url,
                    user_bio: userData.user_bio
                }).where(
                    eq(schema.tbl_user.id, userId)
                ).returning({
                    avatarPath: schema.tbl_user.avatar
                })

            if (updateUser) {
                this.redis.destroyKey(`profileData_${userId}`)
                return APIResponse({ statusCode: HttpStatus.OK, message: "UserData Updated", data: updateUser[0] })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Updating UserData Try AFterSome Time" })
            }
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }


    // For User Profile
    async getUserPurchasedImagesService(userId: string): Promise<APIResponseInterface> {
        try {
            const userPurchases = await this.getUserPurchasedImagesData(userId)
            const data = await this.conn
                .select({
                    imageRawPath: schema.tbl_image.raw_url,
                    thumbnail_url: schema.tbl_image.thumbnail_url,
                    description: schema.tbl_image.description,
                    title: schema.tbl_image.title,
                    userProfileImage: schema.tbl_user.avatar,
                    image_id: schema.tbl_image.id,
                    height: schema.tbl_image.height,
                    width: schema.tbl_image.width,
                    is_paid: schema.tbl_image.is_paid,
                    user_owned: sql<string>`${IMAGE_USER_OWNER_TYPE.PURCHASED}`.as('user_owned'),
                    ownerData: {
                        userName: schema.tbl_user.user_name,
                        userAvatar: schema.tbl_user.avatar,
                        userId: schema.tbl_user.id,
                    },
                    publishedOn: schema.tbl_image.created_at
                })
                .from(schema.tbl_image)
                .leftJoin(schema.tbl_user,
                    eq(schema.tbl_image.user_id, schema.tbl_user.id)
                )
                .where(
                    inArray(
                        schema.tbl_image.id,
                        userPurchases
                    )
                )
            return APIResponse({ statusCode: HttpStatus.OK, message: "", data })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }

    /**
     * @param userId 
     * @returns Array of user purchased image ids
     */

    async getUserPurchases(userId: string | undefined): Promise<APIResponseInterface> {
        if (!userId) {
            return APIResponse({
                statusCode: HttpStatus.OK,
                message: "",
                data: []
            })
        }

        const userPurchasedImages = await this.getUserPurchasedImagesData(userId)

        const privateImagePaths = await this.conn
            .select({
                id: schema.tbl_image.id,
                preview_url: schema.tbl_image.preview_url,
                thumbnail_url: schema.tbl_image.thumbnail_url
            })
            .from(schema.tbl_image)
            .where(
                inArray(schema.tbl_image.id, userPurchasedImages)
            )

        // TODO Cache Data
        const signedUrlsData = await Promise.all(privateImagePaths.map(async (ele) => {
            if ((ele.preview_url && ele.preview_url !== '') && (ele.thumbnail_url && ele.thumbnail_url !== '')) {
                return {
                    ...ele,
                    preview_url: await this.awsServices.getSignedUrl(this.getCloudFrontPrefixImage(ele.preview_url), 300),
                    thumbnail_url: await this.awsServices.getSignedUrl(this.getCloudFrontPrefixImage(ele.thumbnail_url), 300)
                }
            }
            return {
                ...ele,
                preview_url: this.getCloudFrontPrefixImage(ele.preview_url),
                thumbnail_url: this.getCloudFrontPrefixImage(ele.thumbnail_url)
            }
        }))


        return APIResponse({
            statusCode: HttpStatus.OK,
            message: "",
            data: signedUrlsData
        })
    }

    // Private Functions
    /**
     * 
     * @param userId 
     * @returns Array Of imageId user has purchased
     */
    private async getUserPurchasedImagesData(userId: string): Promise<string[]> {
        const userPurchases: string[] = []

        const data = await this.conn.query.tbl_purchases.findMany({
            columns: {
                image_id: true,
            },
            where: (
                eq(
                    schema.tbl_purchases.buyer_id, userId
                )
            )
        },)

        data.forEach((ele) => userPurchases.push(ele.image_id))
        return userPurchases
    }

    private getCloudFrontPrefixImage(imagePath: string): string {
        return `${process.env.AWS_CLOUDFRONT}${imagePath}`
    }
}
