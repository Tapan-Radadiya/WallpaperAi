import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ImageService } from './image.service';
import { craftResponseData, getImageMetaData } from 'src/utils/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadBodyDTO, LikeImageDTO } from 'src/DTO/image.dto';

@Controller('image')
export class ImageController {
    constructor(
        private readonly imageService: ImageService
    ) { }


    @Get('/data')
    async getImages(
        @Query('page') page: string,
        @Res() res: Response,
        @Req() req: Request
    ) {
        const data = await this.imageService.getImages(page)
        return res.status(data.statusCode).json(data)
    }


    @Post('/like')
    async likeImage(
        @Res() res: Response,
        @Req() req: Request,
        @Body() body: LikeImageDTO
    ) {

        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        let responseData = craftResponseData()

        try {
            const data = await this.imageService.imageLike(req.session.userId, body)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.err = data.err ?? {}
            responseData.data = data.data ?? {}
        } catch (error) {
            responseData.err = error ?? {}
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
            responseData.message = "Error"
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Post('/unlike')
    async unLikeImage(
        @Res() res: Response,
        @Req() req: Request,
        @Body() body: LikeImageDTO
    ) {

        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        let responseData = craftResponseData()

        try {
            const data = await this.imageService.unlikeImage(req.session.userId, body)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.err = data.err ?? {}
            responseData.data = data.data ?? {}
        } catch (error) {
            responseData.err = error ?? {}
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
            responseData.message = "Error"
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Post('/upload')
    @UseInterceptors(FileInterceptor('image'))
    async uploadImage(
        @Res() res: Response,
        @Req() req: Request,
        @Body() body: ImageUploadBodyDTO,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        let responseData = craftResponseData()
        const imageMetaData = await getImageMetaData(file)
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

    @Get('/liked-images')
    async getLikedImages(
        @Res() res: Response,
        @Req() req: Request
    ) {
        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        let responseData = craftResponseData()
        try {
            const data = await this.imageService.getAllLikedImages(req.session.userId)
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

    @Get('/image-data/:imageId')
    async getImageDetails(
        @Res() res: Response,
        @Req() req: Request,
        @Param() params: { imageId: string }
    ) {
        if (!req.session.userId) {
            throw new Error("Unauthincated User Found")
        }
        let responseData = craftResponseData()
        try {
            const data = await this.imageService.getImageDetails(params.imageId)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}

        } catch (error) {
            responseData.err = error
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        }
        return res.status(responseData.statusCode).json(responseData.data)
    }
}
