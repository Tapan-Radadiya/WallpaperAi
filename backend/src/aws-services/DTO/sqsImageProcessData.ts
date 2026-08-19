import { IsBoolean, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";
import sharp from "sharp";

export class SQSImageEmbeddingProcessDTO {
    @IsString()
    @IsNotEmpty()
    @Length(10, 500)
    description!: string

    @IsString()
    @IsNotEmpty()
    hashTags!: string

    @IsUUID()
    @IsNotEmpty()
    image_id!: string
}

export class SQSImageProcessDTO {

    @IsNotEmpty()
    fileData!: Express.Multer.File

    @IsBoolean()
    @IsNotEmpty()
    is_image_paid!: boolean

    @IsNotEmpty()
    imageMetaData!: sharp.Metadata
}