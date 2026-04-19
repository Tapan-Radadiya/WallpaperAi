import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import * as crypto from 'crypto';

export class ImageUploadBodyDTO {
    @Transform(({ value }) => value === 'true' ? true : false)
    @IsBoolean({ message: "Invalid value for paid" })
    is_paid!: boolean

    @IsOptional()
    category!: string

    @IsString()
    hashTags!: string

    @IsString()
    description!: string

    @IsString()
    title!: string
}


export class ImageUploadDTO {
    @IsUUID()
    id!: crypto.UUID

    @IsBoolean({ message: "Invalid value for paid" })
    is_paid!: boolean

    @IsOptional()
    category!: string

    @IsString()
    hashTags!: string

    @IsString()
    description!: string

    @IsUUID()
    user_id!: string

    @IsNumber()
    width!: number

    @IsNumber()
    height!: number

    @IsString()
    raw_url!: string

    @IsString()
    thumbnail_url!: string

    @IsString()
    title!: string
}

export class LikeImageDTO {
    @IsUUID()
    imageId!: crypto.UUID

    @IsBoolean({ message: "Invalid value for like" })
    like!: boolean
}