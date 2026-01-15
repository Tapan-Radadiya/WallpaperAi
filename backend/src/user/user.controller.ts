import { Controller, Get, HttpStatus, Param, Query, Req, Res } from '@nestjs/common';
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

    @Get('/username-exists/:username')
    async isUserNameExists(
        @Req() req: Request,
        @Res() res: Response,
        @Param() params: { username: string },
    ) {
        let responseData = craftResponseData()
        try {
            const { message, statusCode, data, err } = await this.userService.isUniqueUser(
                { userEmail: undefined, username: params.username })
            responseData.data = data
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.err = err
        } catch (error) {
            console.log('error-->', error);
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Get('/useremail-exists/:useremail')
    async isUserEmailExists(
        @Req() req: Request,
        @Res() res: Response,
        @Param() params: { useremail: string },
    ) {
        let responseData = craftResponseData()
        try {
            const regex = new RegExp(
                '^[a-zA-Z0-9._%±]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
            );

            const validate = regex.test(params.useremail)
            if (!validate) {
                throw new Error("Invalid EmailId")
            }
            const { message, statusCode, data, err } = await this.userService.isUniqueUser(
                { userEmail: params.useremail, username: undefined })
            responseData.data = data
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.err = err
        } catch (error) {
            // console.log('error-->', error);
            responseData.err = error.message
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
