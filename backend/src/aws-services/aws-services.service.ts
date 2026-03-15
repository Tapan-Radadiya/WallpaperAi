import { CloudFrontClient, CreateInvalidationCommand, ListInvalidationsCommand } from "@aws-sdk/client-cloudfront";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DeleteMessageCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import type { Message } from "@ssut/nestjs-sqs/dist/sqs.types";
import { SqsService } from "@ssut/nestjs-sqs"
import { SQSImageProcessDTO } from "./DTO/sqsImageProcessData";
import { validate } from "class-validator"
import { plainToInstance } from "class-transformer"
import { validateInput } from "src/utils/common";
@Injectable()
export class AwsServicesService {
    private s3Client: S3Client
    private cloudFrontClient: CloudFrontClient
    private sqsClient: SQSClient
    private logger: Logger

    constructor(
        private readonly configService: ConfigService,
        private readonly sqsService: SqsService
    ) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow("AWS_REGION"),

        })
        this.cloudFrontClient = new CloudFrontClient({
            region: this.configService.getOrThrow("AWS_REGION"),
        })

        this.sqsClient = new SQSClient({
            region: this.configService.getOrThrow("AWS_REGION")
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

    async sqsImageProcessingDataPush(imageData: SQSImageProcessDTO) {
        const validatedData = await validateInput(imageData, SQSImageProcessDTO)
        if (validatedData.length > 0) {
            this.logger.log("Invalide Data Passed To Image Processing Queue")
            return
        }

        const data = await this.sqsService.send('wallpaper_ai_fifo_sqs', {
            body: imageData,
            id: Date.now().toString(),
        })
    }

    async sqsMessageDelete(messageId: string) {
        console.log(`Deleteting: ${messageId} `)
        const data = await this.sqsClient.send(
            new DeleteMessageCommand({
                QueueUrl: this.configService.getOrThrow("AWS_SQS_STD_QUEUE_URL"),
                ReceiptHandle: messageId
            })
        )
    }
}
