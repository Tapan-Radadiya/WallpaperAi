import { HttpStatus } from "@nestjs/common"
import { APIResponseInterface } from "src/types/common.types"
import * as bcrypt from "bcrypt"

export const APIResponse = ({ statusCode, message, data, err }: APIResponseInterface) => {
    return {
        statusCode,
        message,
        data,
        err
    }
}

export const craftResponseData = (): APIResponseInterface => {
    return {
        statusCode: HttpStatus.OK,
        message: '',
        data: {},
        err: {}
    }
}


export const hashText = async (plainText: string): Promise<string> => {
    const salt = await bcrypt.genSalt()
    return await bcrypt.hash(plainText, salt)
}

export const compareHash = async (plainText: string, hashedText: string): Promise<boolean> => {
    return await bcrypt.compare(plainText, hashedText)
}