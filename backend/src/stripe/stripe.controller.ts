import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { APIResponse, craftResponseData } from 'src/utils/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {

    constructor(
        private readonly stripeService: StripeService
    ) { }


    @Get('payment')
    async makePayment(
        @Req() req: Request,
        @Res() res: Response
    ) {
        let responseData = craftResponseData()
        if (!req.session.userId) {
            return res.status(HttpStatus.UNAUTHORIZED).json(APIResponse({
                message: "Unauthorized",
                statusCode: HttpStatus.UNAUTHORIZED
            }))
        }
        let userId = req?.session?.userId
        try {
            const data = await this.stripeService.createPaymentSession(200)
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
