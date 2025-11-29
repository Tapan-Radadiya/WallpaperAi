import { APIResponseInterface } from "src/types/common.types"

export const APIResponse = ({ statusCode, message, data, err }: APIResponseInterface) => {
    return {
        statusCode,
        message,
        data,
        err
    }
}