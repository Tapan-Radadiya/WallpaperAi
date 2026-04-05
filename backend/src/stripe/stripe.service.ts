import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '@src/constants';
import * as schema from "../Schema/schema"
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Stripe from "stripe"
import { APIResponseInterface } from '@src/types/common.types';
import { APIResponse } from '@src/utils/common';
import { ImageService } from '@src/image/image.service';
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
            if (imageData?.user_id === userId) {
                return APIResponse({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "User is not allowed to purchase its own image"
                })
            }
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
                payment_intent_data: {
                    metadata: {
                        payment_id: paymentData[0].id,
                        buyer_id: paymentData[0].buyer_id,
                        seller_id: paymentData[0].seller_id,
                    },
                },
                line_items: [
                    {
                        price_data: {
                            unit_amount: price * 100,
                            currency: 'inr',
                            product_data: {
                                name: "Test Image",
                            },
                        },
                        quantity: 1
                    },
                ],
                success_url: 'http://192.168.56.1:3000/'
            })

            return APIResponse({
                message: "Okk",
                statusCode: HttpStatus.OK,
                data: {
                    stripe_payment_url: stripeData.url
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

    async stripeWebhookService(body: any, stripeSign: string): Promise<APIResponseInterface> {
        const payload = body.rawBody
        if (!payload) {
            return APIResponse({
                message: "Invalid Payload",
                statusCode: HttpStatus.BAD_REQUEST
            })
        }
        const event = this.stripe.webhooks.constructEvent(
            payload,
            stripeSign,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
        if (event.type === 'payment_intent.succeeded') {
            const {
                amount_received,
                latest_charge
            } = event.data.object
            const stripeMetaData = event?.data?.object as unknown as {
                metadata: {
                    payment_id: string, buyer_id:
                    string, seller_id: string
                }
            }

            const { seller_id, buyer_id, payment_id } = stripeMetaData.metadata
            const paymentData = await this.conn.query.tbl_payments.findFirst({
                where: eq(
                    schema.tbl_payments.id,
                    payment_id
                )
            })

            if (!paymentData) {
                return APIResponse({
                    message: "Invalid Payload",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }

            if (paymentData.amount * 100 !== amount_received) {
                return APIResponse({
                    message: "Invalid Amount Received",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
            if (paymentData.status === 'SUCCESS') {
                return APIResponse({
                    message: "Invalid Payload",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
            console.log('latest_charge-->', latest_charge);
            console.log("dsadas", typeof latest_charge)
            const updatePayment = await this.updatePaymentStatus({
                payment_id,
                status: 'SUCCESS',
                transaction_id: latest_charge?.toString()
            })
            if (updatePayment) {
                await this.conn
                    .insert(schema.tbl_purchases)
                    .values({
                        buyer_id: updatePayment.buyer_id,
                        image_id: updatePayment.image_id,
                        payment_id: updatePayment.payment_id,
                    })
                return APIResponse({
                    message: "Ok",
                    statusCode: HttpStatus.OK
                })
            } else {
                return APIResponse({
                    message: "Invalid Payload",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
        }
        if (event.type === 'checkout.session.expired') {
            const { payment_id } = event.data.object.metadata as { payment_id: string, buyer_id: string, seller_id: string }
            await this.updatePaymentStatus({
                payment_id,
                status: 'FAILED'
            })
        }
        if (event.type === 'checkout.session.async_payment_failed') {
            const { payment_id } = event.data.object.metadata as { payment_id: string, buyer_id: string, seller_id: string }

            await this.updatePaymentStatus({
                payment_id,
                status: 'FAILED'
            })

            return APIResponse({
                message: "Invalid Payload",
                statusCode: HttpStatus.BAD_REQUEST
            })
        }

        return APIResponse({
            message: "Invalid Payload",
            statusCode: HttpStatus.BAD_REQUEST
        })
    }

    private async updatePaymentStatus({ payment_id, status, transaction_id }: { payment_id: string, status: 'PENDING' | 'SUCCESS' | 'FAILED', transaction_id?: string }): Promise<{
        payment_id: string,
        buyer_id: string,
        seller_id: string,
        image_id: string
    } | null> {
        if (transaction_id) {
            const updatePayment = await this.conn.update(tbl_payments).set({
                status: status,
                transaction_id
            })
                .where(eq(tbl_payments.id, payment_id))
                .returning({
                    payment_id: tbl_payments.id,
                    buyer_id: tbl_payments.buyer_id,
                    seller_id: tbl_payments.seller_id,
                    image_id: tbl_payments.image_id,
                })

            if (updatePayment.length > 0) {
                return updatePayment[0]
            }
        } else {
            const updatePayment = await this.conn.update(tbl_payments).set({
                status: status
            })
                .where(eq(tbl_payments.id, payment_id))
                .returning({
                    payment_id: tbl_payments.id,
                    buyer_id: tbl_payments.buyer_id,
                    seller_id: tbl_payments.seller_id,
                    image_id: tbl_payments.image_id,
                })

            if (updatePayment.length > 0) {
                return updatePayment[0]
            }
        }
        return null
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
