import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ImageSearchService } from './image-search.service';
import { craftResponseData } from 'src/utils/common';
import type { Response, Request } from 'express';

@Controller('image-search')
export class ImageSearchController {
    constructor(
        private readonly ImageSearchService: ImageSearchService
    ) { }


    @Get('')
    async ImageSearchController(
        @Req() req: Request,
        @Res() res: Response,
        @Query() { text }: { text: string }
    ) {
        let responseData = craftResponseData()
        console.log('text-->', text);
        try {
            const data = await this.ImageSearchService.getSearchImageResults(text)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}
        } catch (error) {
            return res.status(responseData.statusCode).json(responseData.data)
        }
        return res.status(responseData.statusCode).json(responseData.data)
    }
}
