import { Body, Controller, HttpStatus, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LoginUserDTO, RegisterUserDTO } from 'src/DTO/user.dto';
import { FileInterceptor } from "@nestjs/platform-express"
import type { Request, Response } from 'express';
import { UserDataType, userLoginType } from 'src/types/common.types';
import { FileuploadService } from 'src/fileupload/fileupload.service';
import { AuthService } from 'src/auth/auth.service';
import { craftResponseData, APIResponse, hashText } from 'src/utils/common';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly AuthService: AuthService,
        private readonly uploadService: FileuploadService
    ) { }
    @Post('register')
    @UseInterceptors(FileInterceptor('user_avatar'))
    async registerUser(
        @Body() body: RegisterUserDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {

        let responseData = craftResponseData()
        const filePath = `${body.displayName}-${body.emailId.split('@')[0]}`
        if (!filePath) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error creating user try after sometime" }))
        }
        const userData: UserDataType = {
            avatar: filePath,
            displayName: body.displayName,
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
                await this.uploadService.uploadFile(filePath, file.buffer, file.mimetype)
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
            const { message, statusCode, data } = await this.AuthService.userLoginService(userData, req)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

}
