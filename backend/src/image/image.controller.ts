import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ImageService } from './image.service';
import { craftResponseData, getImageMetaData } from 'src/utils/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadBodyDTO } from 'src/DTO/image.dto';

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

    @Post('/upload')
    @UseInterceptors(FileInterceptor('image'))
    async uploadImage(
        @Res() res: Response,
        @Req() req: Request,
        @Body() body: ImageUploadBodyDTO,
        @UploadedFile() file: Express.Multer.File
    ) {
        const imageMetaData = await getImageMetaData(file)
        let responseData = craftResponseData()
        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        try {
            const data = await this.imageService.uploadUserImageService(body, imageMetaData, req.session.userId, file)
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
