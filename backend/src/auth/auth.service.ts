import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import * as schema from "../Schema/schema"
import { and, eq } from 'drizzle-orm';
import { UserDataType, APIResponseInterface, userLoginType } from 'src/types/common.types';
import { APIResponse, compareHash } from 'src/utils/common';
import type { Request, Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService
    ) { }

    async registerUserService(userData: UserDataType): Promise<APIResponseInterface> {
        // Insert User Data
        const { avatar, displayName, emailId, password, user_bio, instagram_id = '', portfolio_url = '' } = userData
        try {
            const userExists = await this.conn.query.tbl_user.findFirst({
                where: and(
                    eq(schema.tbl_user.display_name, userData.displayName),
                    eq(schema.tbl_user.email_id, userData.emailId)
                )
            })
            if (userExists) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "User with this name or emailid already exists" })
            }
            const newUser = await this.conn.insert(schema.tbl_user).values({
                avatar,
                display_name: displayName,
                email_id: emailId,
                password,
                instagram_id,
                portfolio_url,
                user_bio
            })
            if (newUser) {
                return APIResponse({ statusCode: HttpStatus.CREATED, message: "user register successfully", data: newUser })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Creating User" })
            }
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Registering User", err: error })
        }
    }

    async userLoginService(userData: userLoginType, req: Request): Promise<APIResponseInterface> {
        try {
            const userExists = await this.conn.query.tbl_user.findFirst({
                where: eq(schema.tbl_user.email_id, userData.emailId)
            })
            if (!userExists) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid email or password" })
            }
            const isValidPassword = await compareHash(userData.password, userExists.password)
            if (!isValidPassword) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid email or password" })
            }

            req.session.userId = userExists.id
            req.session.useremail = userExists.email_id
            const responseData = {
                id: userExists.id,
                displayName: userExists.display_name,
                emailId: userExists.email_id,
                avatarImage: `${process.env.AWS_CLOUDFRONT}${userExists.avatar}`
            }
            return APIResponse({ statusCode: HttpStatus.OK, message: "User logged In Successfully", data: responseData })
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error validation user try after sometime" })
        }
    }
}
