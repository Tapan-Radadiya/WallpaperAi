import { Body, Controller, HttpStatus, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterUserDTO } from 'src/DTO/user.dto';
import { APIResponse, craftResponseData } from 'src/utils/common';
import { UserService } from './user.service';
import { FileInterceptor } from "@nestjs/platform-express"
import type { Express } from 'express';
import { FileuploadService } from 'src/fileupload/fileupload.service';
import { UserDataType } from 'src/types/common.types';

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
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {

        let responseData = craftResponseData()
        const filePath = await this.uploadService.uploadFile('test-user', file.buffer, file.mimetype)

        if (!filePath) {
            return res.status(HttpStatus.CONFLICT).json(APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error creating user try after sometime" }))
        }
        const userData: UserDataType = {
            avatar: filePath,
            displayName: body.displayName,
            emailId: body.emailId
        }
        try {
            const { message, statusCode, data } = await this.userService.registerUserService(userData)
            responseData.message = message
            responseData.statusCode = statusCode
            responseData.data = data ?? {}
        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
