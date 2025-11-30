import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from "express";
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
    constructor(
        private readonly geminiService: GeminiService
    ) { }

    @Post()
    async textToImage(
        @Res() res: Response,
        @Req() req: Request
    ) {
        const { prompt } = req.body
        try {
            const service = await this.geminiService.generateTextToImage(prompt)
            return res.status(HttpStatus.OK).json({ service })
        } catch (error) {
            console.log('error-->', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error })
        }
    }
    @Get()
    async hey() {
        console.log('hello World-->');
        return { message: 'Hello from Gemini API!' };
    }
}
