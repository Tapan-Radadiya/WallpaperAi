import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ImageService } from './image.service';
import { APIResponse, craftResponseData, getImageMetaData, SanitizeImageData } from '@src/utils/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadBodyDTO, LikeImageDTO } from '@src/DTO/image.dto';
import { ALLOWED_IMAGES, ALLOWED_IMAGES_FORMAT } from '@src/constants';
import sharp from 'sharp';
import { APIResponseInterface } from '@src/types/common.types';
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
        if (!ALLOWED_IMAGES.includes(file.mimetype)) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid File Format" }))
        }

        let responseData = craftResponseData()
        const imageMetaData = await getImageMetaData(file)
        const sanitizedBuffer = await SanitizeImageData(file)

        if (sanitizedBuffer.statusCode !== HttpStatus.OK) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Or Corrupted File Found" }))
        }
        try {
            const data = await this.imageService.uploadUserImageService(body, imageMetaData, req.session.userId, { ...file, buffer: sanitizedBuffer.data.imageBuffer })
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


    @Patch("/update-download-count/:imageId")
    async downloadImage(
        @Res() res: Response,
        @Req() req: Request,
        @Param() params: { imageId: string }
    ) {
        let responseData = craftResponseData()
        let userId = req?.session?.userId
        const userIp: string | undefined = req.ip
        try {
            const data = await this.imageService.updateDownloadCounter(params.imageId, userIp, userId)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}
        } catch (error) {
            return res.status(responseData.statusCode).json(responseData.data)
        }
        return res.status(responseData.statusCode).json(responseData.data)
    }

    @Post("/process-image")
    @UseInterceptors(FileInterceptor('image'))
    async processImage(
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        try {
            const data = await SanitizeImageData(file)

            return res.status(data.statusCode).json(APIResponse({ statusCode: data.statusCode, message: data.message }))
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json(APIResponse({ statusCode: HttpStatus.BAD_REQUEST, message: "Invalid Image File" }))
        }
    }
}
