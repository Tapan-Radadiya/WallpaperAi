import { HttpStatus, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { ConfigService } from '@nestjs/config';
import { CloudFront, CloudFrontClient, CreateInvalidationCommand, ListCachePolicies$, ListInvalidationsCommand } from "@aws-sdk/client-cloudfront"

@Injectable()
export class AwsServicesService {
    private s3Client: S3Client
    private cloudFrontClient: CloudFrontClient
    // private cloudFrontClient:
    // private test = config.cloudfront
    constructor(
        private readonly configService: ConfigService
    ) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow("AWS_REGION"),

        })
        this.cloudFrontClient = new CloudFrontClient({
            region: this.configService.getOrThrow("AWS_REGION"),
        })
    }

    async uploadFile(fileName: string, file: Buffer, ContentType: string): Promise<string | null> {
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

    async cloudFrontTest() {
        const data = await this.cloudFrontClient.send(
            new ListInvalidationsCommand({
                DistributionId: this.configService.getOrThrow("AWS_CLOUDRONT_DISTRIBUTION_ID")
            })
        )
        console.log('data-->', data.InvalidationList?.Items);
    }

    async invalidateImage(path: string[]) {
        const invalidate = await this.cloudFrontClient.send(
            new CreateInvalidationCommand({
                DistributionId: this.configService.getOrThrow("AWS_CLOUDRONT_DISTRIBUTION_ID"),
                InvalidationBatch: {
                    CallerReference: `${Date.now()}`,
                    Paths: {
                        Quantity: path.length,
                        Items: path
                    }
                }
            })
        )
        if (invalidate.$metadata.httpStatusCode === HttpStatus.CREATED) {
            console.log(`Invalidated Cache For the Path: ${path}`)
        } else {
            console.log("Error Invalidating Cache")
        }
    }
}
