import { Controller, Get, Req } from '@nestjs/common';
import { craftResponseData } from '@src/utils/common';
import type { Request, Response } from 'express';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(
        private readonly mailService: MailService
    ) { }
    @Get('test-email')
    async sendTestMail(
        @Req() req: Request,
        @Req() res: Response
    ) {
        const { message, statusCode } = await this.mailService.sendTestEmail()

        return res.status(statusCode).json(message)
    }
}
