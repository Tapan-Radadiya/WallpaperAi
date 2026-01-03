import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request, Response } from 'express';
import { APIResponse, craftResponseData } from 'src/utils/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

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

    @Get('/uploaded-images')
    async getUserUploadedImages(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (!req?.session?.userId && !isUUID(req?.session?.userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        let responseData = craftResponseData()
        try {
            if (req.session.userId) {
                const { message, statusCode, data } = await this.userService.getUserUploadedImages(req.session.userId)
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
}
