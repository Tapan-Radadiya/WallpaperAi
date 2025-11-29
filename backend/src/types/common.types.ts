import { HttpStatus } from "@nestjs/common";

export interface APIResponseInterface {
    statusCode: HttpStatus
    message: string
    data?: any
    err?: any
}