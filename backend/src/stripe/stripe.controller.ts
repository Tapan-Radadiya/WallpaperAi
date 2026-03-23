import { Body, Controller, Get, Headers, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from "@nestjs/common"
import type { Response, Request } from 'express';
import { APIResponse, craftResponseData } from 'src/utils/common';
import { StripeService } from './stripe.service';
import { PaymentBody } from './dto/payment.dto';

@Controller('stripe')
export class StripeController {

    constructor(
        private readonly stripeService: StripeService
    ) { }


    @Post('payment')
    async makePayment(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: PaymentBody
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
            const { image_id } = body
            const data = await this.stripeService.createPaymentSession({
                image_id,
                userId
            })
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}
        } catch (error) {
            return res.status(responseData.statusCode).json(responseData)
        }
        return res.status(responseData.statusCode).json(responseData)
    }

    @Post('/webhook')
    async stripeWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {

        let responseData = craftResponseData()
        try {

            const data = await this.stripeService.stripeWebhookService(req, signature)
            responseData.statusCode = data.statusCode
            responseData.message = data.message
            responseData.data = data.data ?? {}
            responseData.err = data.err ?? {}
        } catch (error) {
            responseData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
            responseData.message = "Internal Server Error"
        }
        return res.status(responseData.statusCode).json(responseData)
    }
}
