import { Body, Controller, Get, HttpStatus, Param, Put, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { isUUID } from 'class-validator';
import type { Request, Response } from 'express';
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { UpdateUserDTO } from '@src/DTO/user.dto';
import { UpdateUserType } from '@src/types/common.types';
import { APIResponse, craftResponseData, SanitizeImageData } from '@src/utils/common';
import { UserService } from './user.service';
import * as uuid from "uuid"
import { ALLOWED_IMAGES } from '@src/constants';
@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly awsServices: AwsServicesService
    ) { }

    @Get('profile')
    async getUserProfile(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: { userId: string }
    ) {
        if (!req?.session?.userId && !isUUID(req?.session?.userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        let responseData = craftResponseData()
        if (query.userId) {
            if (!uuid.validate(query.userId)) {
                return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Id" }))
            }
        }
        try {
            const userId = query.userId ? query.userId : req.session.userId ?? ''
            if (req.session.userId) {
                const { message, statusCode, data } = await this.userService.getUserProfile(userId)
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
        @Query() query: { userId: string }
    ) {
        if (!req?.session?.userId && !isUUID(req?.session?.userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        let responseData = craftResponseData()
        if (query.userId) {
            if (!uuid.validate(query.userId)) {
                return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Id" }))
            }
        }
        try {
            if (req.session.userId) {
                const userId = query.userId ? query.userId : req.session.userId ?? ''
                const { message, statusCode, data } = await this.userService.getUserUploadedImages(userId)
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
        } catch (error: any) {
            // console.log('error-->', error);
            responseData.err = error?.message
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Get('/purchased-images')
    async getPurchasedImages(
        @Req() req: Request,
        @Res() res: Response
    ) {
        const userId = req?.session?.userId
        if (!userId || !isUUID(userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        const responseData = craftResponseData()
        try {
            const data = await this.userService.getUserPurchasedImagesService(userId)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data
            responseData.err = data.err
        } catch (error) {
            responseData.err = error
            responseData.message = "Internal Server Error"
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }


    @Put('update-user')
    @UseInterceptors(FileInterceptor('user_avatar'))
    async updateUserController(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: UpdateUserDTO,
        @UploadedFile() file: Express.Multer.File
    ) {

        if (!req?.session?.userId && !isUUID(req?.session?.userId)) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Invalid Id" }))
        }
        if (file && !ALLOWED_IMAGES.includes(file.mimetype)) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid File Format" }))
        }
        const sanitizedBuffer = await SanitizeImageData(file)
        if (sanitizedBuffer.statusCode !== HttpStatus.OK) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Or Corrupted Image Found" }))
        }

        let responseData = craftResponseData()

        try {
            const updateData: UpdateUserType = {
                user_bio: body.user_bio,
                instagram_id: body.instagram_id,
                portfolio_url: body.portfolio_url,
                avatar: ''
            }
            const { message, statusCode, data, err } = await this.userService.updateUserData(req?.session?.userId!, updateData)
            responseData.data = data
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.err = err
            if (statusCode === HttpStatus.OK && file) {
                const { avatarPath } = data
                this.awsServices.invalidateImage([`/${avatarPath}`])
                await this.awsServices.uploadFile(avatarPath, sanitizedBuffer.data.imageBuffer.buffer, file.mimetype)
                responseData.data = {}
            }
        } catch (error: any) {
            responseData.err = error.message
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
