import { ImageUploadDTO } from "@src/DTO/image.dto";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
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

    @IsNotEmpty()
    imageSharpMetaData!: sharp.Metadata


    ImageMetaData!: ImageUploadDTO

    @IsNotEmpty()
    s3_image_path!: string
}
