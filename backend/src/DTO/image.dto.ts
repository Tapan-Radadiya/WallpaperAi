import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import * as crypto from 'crypto';

export class ImageUploadBodyDTO {
    @Transform(({ value }) => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return false;
    })
    @IsBoolean({ message: "Invalid value for paid" })
    is_paid!: boolean;

    @IsOptional()
    category!: string

    @IsString()
    hashTags!: string

    @IsString()
    description!: string

    @IsString()
    title!: string

    @IsOptional({})
    price!: number
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
    preview_url!: string

    @IsString()
    title!: string

    @IsOptional()
    waterMarked_preview_url?: string

    @IsOptional()
    waterMarked_thumbnail_url?: string

    @IsOptional()
    price?: number

    @IsOptional()
    small_image_url?: string
}

export class LikeImageDTO {
    @IsUUID()
    imageId!: crypto.UUID

    @IsBoolean({ message: "Invalid value for like" })
    like!: boolean
}