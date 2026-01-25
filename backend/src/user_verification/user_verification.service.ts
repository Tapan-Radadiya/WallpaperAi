import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomInt } from "crypto";
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { MailService } from 'src/mail/mail.service';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import * as schema from "../Schema/schema";
@Injectable()
export class UserVerificationService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly mailService: MailService,
        private readonly redis: RedisCacheService
    ) { }

    async sendVerificationEmailService(userId: string): Promise<APIResponseInterface> {
        try {
            const userData = await this.conn.query.tbl_user.findFirst({
                where: (
                    eq(schema.tbl_user.id, userId)
                )
            })

            if (userData) {
                const { email_id, user_name } = userData
                const verificationCode = randomInt(100000, 999999)
                const res = await this.conn.insert(schema.tbl_email_verfications).values({
                    email_code: verificationCode.toString(),
                    user_id: userId,
                })

                if (res) {
                    this.mailService.sendEmail('User Verification', './SignUpVerification.pug', email_id, {
                        username: user_name,
                        code: verificationCode,
                        year: new Date().getFullYear(),
                    })
                }
            }
            return APIResponse({ statusCode: HttpStatus.OK, message: "" })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }

    async resendUserVerificationEmailService(userEmail: string): Promise<APIResponseInterface> {
        try {
            const userData = await this.conn.query.tbl_user.findFirst({
                where: (
                    eq(schema.tbl_user.email_id, userEmail)
                )
            })
            if (!userData) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "Unable to find User Try After SomeTime" })
            }
            if (userData.is_verified) {
                return APIResponse({ statusCode: HttpStatus.OK, message: "User is already verified" })
            }
            const userVerificationData = await this.conn.query.tbl_email_verfications.findFirst({
                where: (
                    eq(schema.tbl_email_verfications.user_id, userData.id)
                )
            })

            if (!userVerificationData) {
                this.sendVerificationEmailService(userData.id)
                return APIResponse({ statusCode: HttpStatus.OK, message: `Verification Email Sent To ${userData.email_id}` })
            }

            if (userVerificationData.resend_attempts > 5) {
                return APIResponse({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message: "You Have Reached Maximum Email Verification Limit Try After Some Time" })
            }

            // delete The Currenct Code Record As sendVerificationEmailService will insert new record
            await this.conn.delete(schema.tbl_email_verfications).where(eq(schema.tbl_email_verfications.user_id, userData.id))
            this.sendVerificationEmailService(userData.id)

            return APIResponse({ statusCode: HttpStatus.OK, message: "Email Resended" })

        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }

    async verifyUserService(userEmail: string, verificationCode: string): Promise<APIResponseInterface> {
        try {
            const findUser = await this.conn.query.tbl_user.findFirst({
                where: (
                    eq(schema.tbl_user.email_id, userEmail)
                )
            })
            if (findUser && !findUser.is_verified) {
                const userVerficationData = await this.conn.query.tbl_email_verfications.findFirst({
                    where: (
                        eq(schema.tbl_email_verfications.user_id, findUser.id)
                    )
                })
                if (!userVerficationData) {
                    return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "Error Verifying User Try Again" })
                }

                if (userVerficationData.user_attempts > 5) {
                    return APIResponse({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message: "Maximum Limit Reached Try Resending Email" })
                }
                if (userVerficationData?.expires_at! < new Date()) {
                    return APIResponse({ statusCode: HttpStatus.GONE, message: "Verification Code Expired" })
                }

                if (userVerficationData.email_code !== verificationCode) {

                    const userAttempts = userVerficationData.user_attempts + 1

                    await this.conn.update(schema.tbl_email_verfications).set({
                        user_attempts: userAttempts
                    }).where(eq(schema.tbl_email_verfications.id, userVerficationData.id))

                    return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Verfication Code" })
                }

                const updateUser = await this.conn.update(schema.tbl_user).set({
                    is_verified: true
                }).where(eq(schema.tbl_user.id, findUser.id))

                await this.redis.destroyKey(`profileData_${findUser.id}`)
                const deleteUserData = await this.conn.delete(schema.tbl_email_verfications).where(
                    eq(schema.tbl_email_verfications.user_id, findUser.id)
                )

                return APIResponse({ statusCode: HttpStatus.OK, message: "User Verified Successfully" })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "User Already Verified" })
            }
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }
}
