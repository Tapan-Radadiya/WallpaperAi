import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { APIResponseInterface, UpdateUserType } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import * as schema from "../Schema/schema";
import { AwsServicesService } from 'src/aws-services/aws-services.service';

@Injectable()
export class UserService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly awsServices: AwsServicesService
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
                    }
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
            const userImageData = await this.conn
                .select({
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
                    }
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
                        isNotNull(schema.tbl_image.id)
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
}
