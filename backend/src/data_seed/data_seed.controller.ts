import { Controller, Get, Inject, Injectable, Logger, Req, Res } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import sharp from 'sharp';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { ImageService } from 'src/image/image.service';
import * as schema from "../Schema/schema";
import { ImageUploadBodyDTO } from 'src/DTO/image.dto';

@Controller('data-seed')
@Injectable()
export class DataSeedController {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly imageService: ImageService
    ) { }

    private readonly logger = new Logger(DataSeedController.name)

    private IMAGE_FORMAT_TO_MIME: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
        tiff: 'image/tiff',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
    };

    @Get('')
    async uploadUserImages(
        @Req() req: Request,
        @Res() res: Response
    ) {
        const userId = "780e2b01-1dc5-4850-9dd6-e6811fa2bb5c"
        const start = 0
        const end = 1
        const isUserExists = await this.conn.query.tbl_user.findFirst({
            where: eq(
                schema.tbl_user.id, userId
            )
        })

        if (!isUserExists) {
            return res.json("User Not Exists")
        }

        const imagePath = '/home/tapan/codesandbox/wallpaper/Unsplash_Images'

        const data = await fs.readdirSync(imagePath)
        const test: any = []
        for (let index = start; index <= end; index++) {
            console.log(data[index])
            const buffer = fs.readFileSync(`${imagePath}/${data[index]}`)
            const testdata = await sharp(buffer).metadata()

            const multerData = {
                buffer,
                originalname: data[index],
                encoding: '7bit',
                mimetype: this.IMAGE_FORMAT_TO_MIME[testdata.format],
                size: testdata.size,
            } as Express.Multer.File

            await this.imageService.uploadUserImageService({
                category: '',
                description: '',
                hashTags: '',
                is_paid: false,
                title: ''
            }, testdata, userId, multerData)
            this.logger.log(`Image: ${index} Uploaded ✅`)
        }
        return res.json(test)

    }
}
