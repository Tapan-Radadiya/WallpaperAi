import { HttpStatus, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileuploadService {
    private s3Client: S3Client
    constructor(
        private readonly configService: ConfigService
    ) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow("AWS_REGION"),

        })
    }

    async uploadFile(fileName: string, file: Buffer, ContentType: string): Promise<string | null> {
        console.log('ContentType-->', ContentType);
        const uploadedFile = await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.configService.getOrThrow("AWS_BUCKET_NAME"),
                Key: fileName,
                Body: file,
                ContentType
            }))

        if (uploadedFile.$metadata.httpStatusCode === HttpStatus.OK) {
            return fileName
        } else {
            return null
        }
    }
}
