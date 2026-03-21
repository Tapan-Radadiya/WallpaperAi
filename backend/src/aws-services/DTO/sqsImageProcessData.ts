import { IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class SQSImageProcessDTO {
    @IsString()
    @IsNotEmpty()
    @Length(10, 500)
    description: string

    @IsString()
    @IsNotEmpty()
    hashTags: string

    @IsUUID()
    @IsNotEmpty()
    image_id: string
}