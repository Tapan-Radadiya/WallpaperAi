import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from "../Schema/schema"
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Stripe from "stripe"
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import { ImageService } from 'src/image/image.service';
import { InferSelectModel } from "drizzle-orm"

type imageData = InferSelectModel<typeof schema.tbl_image>;
@Injectable()
export class StripeService {
    private stripe: Stripe
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly imageService: ImageService
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    }

    async createPaymentSession({ image_id, userId }: { image_id: string, userId: string }): Promise<APIResponseInterface> {
        try {
            if (!image_id) {
                return APIResponse({
                    message: "Image Id Not Received",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
            const { message, statusCode, data } = await this.imageService.getImageDetails(image_id)

            if (statusCode !== HttpStatus.OK || !data) {
                return APIResponse({ message, statusCode })
            }

            const stripeData = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            unit_amount: 0,
                            currency: 'usd',
                            product_data: {
                                name: "Test Image"
                            },
                        },
                        quantity: 1
                    }
                ],
                success_url: 'http://192.168.56.1:3000/'
            })
            return APIResponse({
                message: "Okk",
                statusCode: HttpStatus.OK,
                data: {
                    navigate_url: stripeData.url
                }
            })
        } catch (error) {
            console.log('error-->', error);
            return APIResponse({
                message: "Error",
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR
            })
        }
    }
}
