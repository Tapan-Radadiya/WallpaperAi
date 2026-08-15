import { HttpStatus } from "@nestjs/common";

export interface APIResponseInterface {
    statusCode: HttpStatus
    message: string
    data?: any
    err?: any
    customHeaders?: Record<string, string> | null
}

export type UserDataType = {
    id: string
    userName: string
    emailId: string
    avatar: string
    password: string
    user_bio: string
    instagram_id?: string
    portfolio_url?: string
}

export type UpdateUserType = {
    avatar: string
    user_bio: string
    instagram_id?: string
    portfolio_url?: string
}

export type userLoginType = {
    emailId: string
    password: string
}

export type SharpImageMetaDataType = {
    format: string,
    size: number,
    width: number,
    height: number,
    autoOrient: SharpImageAutoOrientDataType,
}

export type SharpImageAutoOrientDataType = {
    width: number
    height: number
}