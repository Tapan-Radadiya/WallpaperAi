import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';
import type { Request, Response } from 'express';
import { craftResponseData } from '@src/utils/common';
import { ResendVerificationEmailDTO, UserVerificationDTO } from '@src/DTO/user.dto';

@Controller('user-verification')
export class UserVerificationController {
    constructor(
        private readonly userVerificationService: UserVerificationService
    ) { }


    @Post('/resend-verification-email')
    async resendEmailVerification(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: ResendVerificationEmailDTO
    ) {
        let responseData = craftResponseData()

        try {
            const { message, statusCode, data } = await this.userVerificationService.resendUserVerificationEmailService(body.emailId)
            responseData.data = data
            responseData.message = message
            responseData.statusCode = statusCode
        } catch (error) {
            responseData.err = error.message
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }


    @Post('/verify-user')
    async verifyUser(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: UserVerificationDTO
    ) {
        let responseData = craftResponseData()

        try {
            const { message, statusCode, data, err } = await this.userVerificationService.verifyUserService(body.emailId, body.verificationCode)
            responseData.data = data
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.err = err
        } catch (error) {
            console.log('error-->', error);
            responseData.err = error.message
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
