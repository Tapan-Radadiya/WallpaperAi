import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from "../Schema/schema"
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Stripe from "stripe"
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import { ImageService } from 'src/image/image.service';
import { eq, InferSelectModel } from "drizzle-orm"
import { tbl_payments } from './schema/schema';
import type { RawBodyRequest } from "@nestjs/common"

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

            if (!process.env.PLATFORM_CUT) {
                return APIResponse({
                    message: "Problem from our end we will reach you soon",
                    statusCode: HttpStatus.CONFLICT
                })
            }

            const imageData = await this.conn.query.tbl_image.findFirst({
                where: eq(schema.tbl_image.id, image_id)
            })
            if (!imageData) {
                return APIResponse({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "Unable to find image"
                })
            }

            const { id, user_id: imageOwnerId, is_paid, price } = imageData

            if (!is_paid || !price || !(price >= 0)) {
                return APIResponse({
                    statusCode: HttpStatus.CONFLICT,
                    message: "Unable to process at the moment"
                })
            }

            const { platFormCut, userCut } = this.getUserAndPlatformCutValue(price)

            const paymentData = await this.conn.insert(tbl_payments).values({
                amount: price,
                buyer_id: userId,
                image_id: id,
                platform_cut: platFormCut,
                seller_id: imageOwnerId,
                user_cut: userCut,
            }).returning({
                id: tbl_payments.id,
                buyer_id: tbl_payments.buyer_id,
                seller_id: tbl_payments.seller_id
            })

            if (!paymentData) {
                return APIResponse({
                    statusCode: HttpStatus.CONFLICT,
                    message: "Error creating purchase try after sometime"
                })
            }

            const stripeData = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            unit_amount: price,
                            currency: 'usd',
                            product_data: {
                                name: "Test Image"
                            },
                        },
                        quantity: 1,
                        metadata: {
                            payment_id: paymentData[0].id,
                            buyer_id: paymentData[0].buyer_id,
                            seller_id: paymentData[0].seller_id,
                        }
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

    async stripeWebhookService(body: any, stripeSign: string) {
        const payload = body.rawBody
        if (!payload) {
            return
        }
        const event = this.stripe.webhooks.constructEvent(
            payload,
            stripeSign,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
        console.log('event.data-->', event);
        if (event.type === 'checkout.session.completed') {
        }
    }

    private getUserAndPlatformCutValue(imagePrice: number): { platFormCut: number, userCut: number } {
        const currentPlatformCutPercentage: number = parseInt(process.env.PLATFORM_CUT!)

        const platFormCut = imagePrice / currentPlatformCutPercentage

        const userCut = imagePrice - platFormCut
        return {
            platFormCut,
            userCut
        }
    }
}
