import { HttpStatus } from "@nestjs/common"
import { APIResponseInterface, SharpImageMetaDataType } from "src/types/common.types"
import * as bcrypt from "bcrypt"
import sharp from "sharp"
import { ALLOWED_IMAGES_FORMAT } from "src/constants"
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

export const getImageMetaData = async (imgBuffer: Express.Multer.File): Promise<sharp.Metadata> => {
    const imageData = await sharp(imgBuffer.buffer).metadata()
    return imageData
}

export const SanitizeImageData = async (file: Express.Multer.File): Promise<APIResponseInterface> => {
    let responseData = craftResponseData()

    const metaData = await sharp(file.buffer, { limitInputPixels: 25_000_000 }).metadata()

    if (!metaData.width || !metaData.height) {
        responseData.statusCode = HttpStatus.BAD_REQUEST
        responseData.message = "Invalid Image"
    }

    if (!ALLOWED_IMAGES_FORMAT.includes(metaData.format)) {
        responseData.statusCode = HttpStatus.BAD_REQUEST
        responseData.message = "Image Format Not Supported"
    }
    const sanitizedBuffer = await sharp(file.buffer)
        .rotate()
        .toBuffer()
    if (responseData.statusCode === HttpStatus.OK) {
        return APIResponse({ statusCode: responseData.statusCode, message: "Valid", data: { imageBuffer: sanitizedBuffer } })
    }
    return APIResponse({ statusCode: responseData.statusCode, message: responseData.message })
}