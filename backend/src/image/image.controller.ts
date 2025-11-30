import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
    constructor(
        private readonly imageService: ImageService
    ) { }
    @Get('')
    async getImages(
        @Query('page') page: string,
        @Res() res: Response,
        @Req() req: Request
    ) {
        const data = await this.imageService.getImages(page)
        return res.status(data.statusCode).json(data)
        // return res.status(data.statusCode).json(data)
    }
}
