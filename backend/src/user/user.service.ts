import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { userLoginType, APIResponseInterface, UserDataType } from 'src/types/common.types';
import * as schema from "../Schema/schema"
import { APIResponse, compareHash } from 'src/utils/common';
import { and, eq, exists, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import type { Request, Response } from 'express';

@Injectable()
export class UserService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService
    ) { }

    private TABLE_USER_ALIAS = alias(schema.tbl_user, 'TABLE_USER_ALIAS')

    // async registerUserService(userData: UserDataType): Promise<APIResponseInterface> {
    //     // Insert User Data
    //     const { avatar, displayName, emailId, password, user_bio, instagram_id = '', portfolio_url = '' } = userData
    //     try {
    //         const userExists = await this.conn.query.tbl_user.findFirst({
    //             where: and(
    //                 eq(schema.tbl_user.display_name, userData.displayName),
    //                 eq(schema.tbl_user.email_id, userData.emailId)
    //             )
    //         })
    //         if (userExists) {
    //             return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "User with this name or emailid already exists" })
    //         }
    //         const newUser = await this.conn.insert(schema.tbl_user).values({
    //             avatar,
    //             display_name: displayName,
    //             email_id: emailId,
    //             password,
    //             user_bio,
    //             instagram_id,
    //             portfolio_url
    //         })
    //         if (newUser) {
    //             return APIResponse({ statusCode: HttpStatus.CREATED, message: "user register successfully", data: newUser })
    //         } else {
    //             return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Creating User" })
    //         }
    //     } catch (error) {
    //         return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Registering User", err: error })
    //     }
    // }

    // async userLoginService(userData: userLoginType, req: Request): Promise<APIResponseInterface> {
    //     try {
    //         const userExists = await this.conn.query.tbl_user.findFirst({
    //             where: eq(schema.tbl_user.email_id, userData.emailId)
    //         })
    //         if (!userExists) {
    //             return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid email or password" })
    //         }
    //         const isValidPassword = await compareHash(userData.password, userExists.password)
    //         if (!isValidPassword) {
    //             return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid email or password" })
    //         }

    //         req.session.userId = userExists.id
    //         req.session.useremail = userExists.email_id
    //         const responseData = {
    //             id: userExists.id,
    //             displayName: userExists.display_name,
    //             emailId: userExists.email_id,
    //             avatarImage: `${process.env.AWS_CLOUDFRONT}${userExists.avatar}`
    //         }
    //         return APIResponse({ statusCode: HttpStatus.OK, message: "User logged In Successfully", data: responseData })
    //     } catch (error) {
    //         return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error validation user try after sometime" })
    //     }
    // }

    async getUserProfile(userId: string): Promise<APIResponseInterface> {
        try {
            const userData = await this.conn.query.tbl_user.findFirst({
                where: eq(schema.tbl_user.id, userId)
            })
            if (userData) {
                const responseData = {
                    id: userData.id,
                    displayName: userData.display_name,
                    emailId: userData.email_id,
                    avatarImage: `${process.env.AWS_CLOUDFRONT}${userData.avatar}`,
                    user_bio: userData.user_bio,
                    instagram_id: userData.instagram_id ?? '',
                    portfolio_url: userData.portfolio_url ?? '',
                    is_verified: userData.is_verified
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
            const isRedisDataStored = await this.redis.getRedisKeyValue(`profileData_${userId}`)
            if (isRedisDataStored) {
                return APIResponse({ statusCode: HttpStatus.OK, message: "userdata", data: JSON.parse(isRedisDataStored) })
            }
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
                        userName: this.TABLE_USER_ALIAS.display_name
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
                        userName: schema.tbl_user.display_name
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
                            schema.tbl_user.display_name, data.username
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
}
