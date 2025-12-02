import { HttpStatus } from "@nestjs/common"
import { APIResponseInterface } from "src/types/common.types"

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