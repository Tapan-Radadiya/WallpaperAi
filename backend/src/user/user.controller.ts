import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginUserDTO, RegisterUserDTO } from 'src/DTO/user.dto';
import { APIResponse, compareHash, craftResponseData, hashText } from 'src/utils/common';
import { UserService } from './user.service';
import { FileInterceptor } from "@nestjs/platform-express"
import type { Express } from 'express';
import { FileuploadService } from 'src/fileupload/fileupload.service';
import { UserDataType, userLoginType } from 'src/types/common.types';
import { isUUID } from 'class-validator';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
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
            user_bio: body.user_bio
        }

        try {
            const { message, statusCode, data, err } = await this.userService.registerUserService(userData)
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
            const { message, statusCode, data } = await this.userService.userLoginService(userData, req)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Get('profile')
    async getUserProfile(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (!req?.session?.userId && !isUUID(req?.session?.userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        let responseData = craftResponseData()
        try {
            if (req.session.userId) {
                const { message, statusCode, data } = await this.userService.getUserProfile(req?.session?.userId)
                responseData.data = data
                responseData.message = message
                responseData.statusCode = statusCode
            } else {
                throw new Error("Invalid Id")
            }
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Get('/userData')
    async getUserlikedImages(
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (!req?.session?.userId) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        let responseData = craftResponseData()
        try {
            const data = await this.userService.getUserLikedImages(req.session.userId)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
