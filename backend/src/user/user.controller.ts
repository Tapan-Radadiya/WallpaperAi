import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterUserDTO } from 'src/DTO/user.dto';
import { craftResponseData } from 'src/utils/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post('register')
    async registerUser(
        @Body() body: RegisterUserDTO,
        @Res() res: Response
    ) {
        let responseData = craftResponseData()
        try {
            const { message, statusCode, data } = await this.userService.registerUserService(body)
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
