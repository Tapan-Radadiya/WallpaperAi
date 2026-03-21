import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from "../Schema/schema"
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Stripe from "stripe"
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';

@Injectable()
export class StripeService {
    private stripe: Stripe
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    }

    async makeStripePaymentReq() {

    }

    async createPaymentSession(amount: number): Promise<APIResponseInterface> {
        try {
            console.log("hello Ji")
            const data = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            unit_amount: amount,
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
            console.log('data-->', data);
            return APIResponse({
                message: "Okk",
                statusCode: HttpStatus.OK,
                data: {
                    navigate_url: data.url
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
