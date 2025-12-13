import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsStrongPassword, IsUrl, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import * as crypto from 'crypto';

export class ImageUploadBodyDTO {
    @Transform(({ value }) => Boolean(value))
    @IsBoolean({ message: "Invalid value for paid" })
    is_paid: boolean

    @IsOptional()
    category: string

    @IsString()
    hashTags: string

    @IsString()
    description: string
}


export class ImageUploadDTO {
    @IsUUID()
    id: crypto.UUID

    @IsBoolean({ message: "Invalid value for paid" })
    is_paid: boolean

    @IsOptional()
    category: string

    @IsString()
    hashTags: string

    @IsString()
    description: string

    @IsUUID()
    user_id: string

    @IsNumber()
    width: number

    @IsNumber()
    height: number

    @IsString()
    raw_url: string

    @IsString()
    thumbnail_url: string
}