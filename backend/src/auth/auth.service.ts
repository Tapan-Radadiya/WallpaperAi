import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@src/constants';
import { RedisCacheService } from '@src/redis_cache/redis_cache.service';
import * as schema from "../Schema/schema"
import { and, eq } from 'drizzle-orm';
import { UserDataType, APIResponseInterface, userLoginType } from '@src/types/common.types';
import { APIResponse, compareHash, hashText } from '@src/utils/common';
import type { Request, Response } from 'express';
import { UserVerificationService } from '@src/user_verification/user_verification.service';
import { MailService } from '@src/mail/mail.service';
import { UserResetPasswordDTO } from '@src/DTO/user.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly redis: RedisCacheService,
        private readonly userVerification: UserVerificationService,
        private readonly mailService: MailService
    ) { }

    async registerUserService(userData: UserDataType): Promise<APIResponseInterface> {
        // Insert User Data
        const { avatar, userName, emailId, password, user_bio, instagram_id = '', portfolio_url = '' } = userData
        try {
            const userExists = await this.conn.query.tbl_user.findFirst({
                where: and(
                    eq(schema.tbl_user.user_name, userData.userName),
                    eq(schema.tbl_user.email_id, userData.emailId)
                )
            })
            if (userExists) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "User with this name or emailid already exists" })
            }
            const newUser = await this.conn.insert(schema.tbl_user).values({
                avatar,
                user_name: userName,
                email_id: emailId,
                password,
                instagram_id,
                portfolio_url,
                user_bio
            }).returning({
                id: schema.tbl_user.id
            })
            if (newUser?.length > 0) {
                this.userVerification.sendVerificationEmailService(newUser?.[0]?.id)
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
                userName: userExists.user_name,
                emailId: userExists.email_id,
                avatarImage: `${process.env.AWS_CLOUDFRONT}${userExists.avatar}`,
                is_verified: userExists?.is_verified
            }
            return APIResponse({ statusCode: HttpStatus.OK, message: "User logged In Successfully", data: responseData })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error validation user try after sometime", err: error })
        }
    }

    async userLogoutService(req: Request, res: Response): Promise<APIResponseInterface> {
        try {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Logging out user" })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Logging out user", err: error })
        }
    }

    async resetPasswordEmailService(userEmail: string, hostName: string): Promise<APIResponseInterface> {
        try {
            const isUserExists = await this.conn.query.tbl_user.findFirst({
                where: (
                    eq(schema.tbl_user.email_id, userEmail)
                )
            })
            if (!isUserExists) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "User not found" })
            }
            const userHash = await hashText(`${isUserExists.id}${isUserExists.created_at}`)
            const saveToTable = await this.conn.insert(schema.tbl_user_reset_tickets).values({
                userId: isUserExists.id,
                userTicket: userHash
            })
            if (!saveToTable) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error generating reset link" })
            }
            else {
                const userResetLink = `${process.env.FRONTEND_URL ?? hostName}/reset-password/?ticket=${userHash}`
                await this.mailService.sendEmail("Reset Password Link", './ResetPassword.pug', userEmail, {
                    username: isUserExists.user_name,
                    resetLink: userResetLink,
                    year: new Date(),
                })
                return APIResponse({ statusCode: HttpStatus.OK, message: "Verification Link Sent Successfully" })
            }
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Processing Request" })
        }
    }

    async resetUserPasswordService(userBody: UserResetPasswordDTO): Promise<APIResponseInterface> {
        const { new_password, user_ticket } = userBody

        try {
            const isUserTicketExists = await this.conn.query.tbl_user_reset_tickets.findFirst({
                where: eq(
                    schema.tbl_user_reset_tickets.userTicket, user_ticket
                )
            })

            if (!isUserTicketExists) {
                return APIResponse({ statusCode: HttpStatus.NOT_FOUND, message: "Invalid User Ticket" })
            }
            if (isUserTicketExists.is_url_accessed) {
                return APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Reset Password Link Is Expired" })
            }
            if (new Date() > new Date(`${isUserTicketExists.expires_at}`)) {
                return APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Reset Password Link Is Expired" })
            }

            const hashedPassword = await hashText(new_password)

            const updateUser = await this.conn
                .update(schema.tbl_user)
                .set({
                    password: hashedPassword
                })
                .where(eq(schema.tbl_user.id, isUserTicketExists.userId))

            await this.conn.update(schema.tbl_user_reset_tickets).set({
                is_url_accessed: true
            }).where(eq(schema.tbl_user_reset_tickets.id, isUserTicketExists.id))

            if (!updateUser) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Resetting Password Try After Sometime" })
            }
            return APIResponse({ statusCode: HttpStatus.OK, message: "Password changed successfully" })
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Resetting Password" })
        }
    }
}
