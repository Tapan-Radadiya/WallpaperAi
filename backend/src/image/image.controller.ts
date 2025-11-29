import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
    constructor(
        private readonly imageService: ImageService
    ) { }
    @Get('image')
    async getImages(
        @Res() res: Response,
        @Req() req: Request
    ) {
        const data = await this.imageService.getImages()
        return res.status(data.statusCode).json(data)
    }
}
