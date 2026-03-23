import { IsNotEmpty } from "class-validator";

export class PaymentBody {
    @IsNotEmpty()
    image_id: string
}