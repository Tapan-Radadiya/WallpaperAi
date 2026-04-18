import { Body, Controller, HttpStatus, Post, Req, Res, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from 'express';
import { AuthService } from '@src/auth/auth.service';
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { ALLOWED_IMAGES } from '@src/constants';
import { LoginUserDTO, RegisterUserDTO, ResetPasswordDTO, UserResetPasswordDTO } from '@src/DTO/user.dto';
import { UserDataType, userLoginType } from '@src/types/common.types';
import { APIResponse, craftResponseData, hashText, SanitizeImageData } from '@src/utils/common';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly AuthService: AuthService,
        private readonly awsService: AwsServicesService
    ) { }
    @Post('register')
    @UseInterceptors(FileInterceptor('user_avatar'))
    async registerUser(
        @Body() body: RegisterUserDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!ALLOWED_IMAGES.includes(file.mimetype)) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid File Format" }))
        }

        const sanitizedBuffer = await SanitizeImageData(file)
        if (sanitizedBuffer.statusCode !== HttpStatus.OK) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Or Corrupted Image Found" }))
        }

        let responseData = craftResponseData()
        const filePath = `${body.userName}-${body.emailId.split('@')[0]}`
        if (!filePath) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error creating user try after sometime" }))
        }

        const userData: UserDataType = {
            avatar: filePath,
            userName: body.userName,
            emailId: body.emailId,
            password: await hashText(body.password),
            user_bio: body.user_bio,
            instagram_id: body.instagram_id ?? '',
            portfolio_url: body.portfolio_url ?? ''
        }

        try {
            const { message, statusCode, data, err } = await this.AuthService.registerUserService(userData)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data ?? {}
            responseData.err = err ?? {}

            if (statusCode === HttpStatus.CREATED)
                await this.awsService.uploadFile(filePath, sanitizedBuffer.data.imageBuffer.buffer, file.mimetype)
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Post('login')
    async userLoginValidation(
        @Body() body: LoginUserDTO,
        @Res() res: Response,
        @Req() req: Request
    ) {
        let responseData = craftResponseData()
        const userData: userLoginType = {
            emailId: body.emailId,
            password: body.password
        }
        try {
            const { message, statusCode, data, err } = await this.AuthService.userLoginService(userData, req)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data
            responseData.err = err
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Post('log-out')
    async userLogout(
        @Res() res: Response,
        @Req() req: Request
    ) {
        let responseData = craftResponseData()

        if (!req.session.userId) {
            throw new Error("user is not logged in")
        }

        try {
            req.session.destroy((err) => {
                if (err) {
                    console.log('err-->', err);
                    throw new Error("Error logging out user")
                }
                res.clearCookie('connect.sid').status(HttpStatus.OK).json(APIResponse({ message: "User Logged Out", statusCode: HttpStatus.OK }))
            })
            return
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Put('/reset-password')
    async resetUserPassword(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: ResetPasswordDTO
    ) {

        let responseData = craftResponseData()
        try {
            const { message, statusCode, data, err } = await this.AuthService.resetPasswordEmailService(body.emailId, req.hostname)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data
            responseData.err = err
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }

        return res.status(responseData.statusCode).json(responseData)
    }

    @Post("/update-password")
    async updateUserPassword(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: UserResetPasswordDTO
    ) {
        let responseData = craftResponseData()
        try {
            const { message, statusCode, data, err } = await this.AuthService.resetUserPasswordService(body)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data
            responseData.err = err
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }

        return res.status(responseData.statusCode).json(responseData)
    }
}
