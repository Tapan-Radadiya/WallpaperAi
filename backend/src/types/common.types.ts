import { HttpStatus } from "@nestjs/common";

export interface APIResponseInterface {
    statusCode: HttpStatus
    message: string
    data?: any
    err?: any
}

export type UserDataType = {
    id?: string
    displayName: string
    emailId: string
    avatar: string
    password: string
}
export type userLoginType = {
    emailId: string
    password: string
}