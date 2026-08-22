import { HttpStatus } from "@nestjs/common"
import { APIResponseInterface, SharpImageMetaDataType } from "@src/types/common.types"
import * as bcrypt from "bcrypt"
import sharp from "sharp"
import { ALLOWED_IMAGES_FORMAT } from "@src/constants"
import { plainToInstance } from "class-transformer"
import { validate } from "class-validator"
import { SystemMessage, HumanMessage } from "@langchain/core/messages"

export const APIResponse = ({ statusCode, message, data, err, customHeaders }: APIResponseInterface) => {
    return {
        statusCode,
        message,
        data,
        err,
        customHeaders
    }
}

/**
 * By default it will return   HttpStatus as OK
 * @returns Response Object with data {statusCode:OK,message:'',data:{},err:{}}
*/
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

export const validateInput = async (payload, dtoType) => {
    const plainObj = plainToInstance(dtoType, payload)
    const validatedData = await validate(plainObj)
    if (validatedData.length > 0) {
        return validatedData
    } else {
        return []
    }
}


export const getUserProfileDataCacheKey = (userId: string): string => {
    return `userData:${userId}:profileData`
}

export const getUserPurchasedImageDataCacheKey = (userId: string): string => {
    return `user:purchased-assets:${userId}`
}


/**
  * 
  * @param param0 
  * @returns {
         imageThumbnailPath: string,
         imageRawPath: string,
         imagePreviewPath: string,
         waterMarkedImagePath?: string,
         waterMarkedPreviewPath?: string
         waterMarkedThumbnailPath?: string
     }
  */
export function getImagepaths({ is_paid, userId, imageUuid, format }: { is_paid: boolean, userId: string, imageUuid: string, format: string }): {
    imageThumbnailPath: string,
    imageRawPath: string,
    imagePreviewPath: string,
    waterMarkedImagePath?: string,
    waterMarkedPreviewPath?: string
    waterMarkedThumbnailPath?: string,
    temp_path: string,
    small_url: string
} {

    const PREFIX_PATH = `${process.env.S3_PREFIX}/${userId}/${imageUuid}`
    if (is_paid) {
        return {
            imagePreviewPath: `${PREFIX_PATH}/premium/preview.webp`,
            imageRawPath: `${PREFIX_PATH}/premium/raw.${format}`,
            imageThumbnailPath: `${PREFIX_PATH}/premium/thumbnail.webp`,
            waterMarkedImagePath: `${PREFIX_PATH}/waterMarkedImage.webp`,
            waterMarkedPreviewPath: `${PREFIX_PATH}/waterMarkedPreview.webp`,
            waterMarkedThumbnailPath: `${PREFIX_PATH}/waterMarkedThumbnail.webp`,
            temp_path: `${PREFIX_PATH}/temp/raw.${format}`,
            small_url: `${PREFIX_PATH}/small.webp`
        }
    } else {
        return {
            imagePreviewPath: `${PREFIX_PATH}/preview.webp`,
            imageRawPath: `${PREFIX_PATH}/raw.${format}`,
            imageThumbnailPath: `${PREFIX_PATH}/thumbnail.webp`,
            waterMarkedImagePath: '',
            temp_path: `${PREFIX_PATH}/temp/raw.${format}`,
            small_url: `${PREFIX_PATH}/small.webp`
        }
    }
}