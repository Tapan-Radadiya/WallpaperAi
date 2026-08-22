import { CloudFrontClient, CreateInvalidationCommand, ListInvalidationsCommand } from "@aws-sdk/client-cloudfront";
import { DeleteObjectCommand, DeleteObjectCommandOutput, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsService } from "@ssut/nestjs-sqs";
import { validateInput } from "@src/utils/common";
import { SQSImageEmbeddingProcessDTO, SQSImageProcessDTO } from "./DTO/sqsImageProcessData";
import { LoggingService } from "@src/logging/logging.service";
import { CloudfrontSignInputWithPolicy, getSignedUrl } from "@aws-sdk/cloudfront-signer";
import * as fs from "fs"
import { getSignedUrlPolicy } from "./aws.policy";
import { AWS_QUEUE_NAMES, AWS_QUEUE_URLS } from "./aws-service.types";

@Injectable()
export class AwsServicesService {
    private s3Client: S3Client
    private cloudFrontClient: CloudFrontClient
    private sqsClient: SQSClient
    private logger: Logger = new Logger(AwsServicesService.name)

    constructor(
        private readonly configService: ConfigService,
        private readonly sqsService: SqsService,
        private readonly loggingService: LoggingService
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

    // S3 Services
    async uploadFile(fileName: string, file: Buffer, ContentType: string): Promise<string | null> {
        const uploadedFile = await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.configService.getOrThrow("AWS_BUCKET_NAME"),
                Key: fileName,
                Body: file,
                ContentType,
                CacheControl: 'public, max-age=31536000, immutable'
            }))

        if (uploadedFile.$metadata.httpStatusCode === HttpStatus.OK) {
            return fileName
        } else {
            return null
        }
    }

    async getS3FileData(filePath: string): Promise<GetObjectCommandOutput | null> {
        const fileData = await this.s3Client.send(
            new GetObjectCommand({
                Bucket: this.configService.getOrThrow("AWS_BUCKET_NAME"),
                Key: filePath
            })
        )
        if (fileData.$metadata.httpStatusCode === HttpStatus.OK) {
            return fileData
        } else {
            return null
        }
    }

    async removeS3Object(filePath: string): Promise<DeleteObjectCommandOutput | null> {
        const deletedObject = await this.s3Client.send(
            new DeleteObjectCommand({
                Bucket: this.configService.getOrThrow("AWS_BUCKET_NAME"),
                Key: filePath
            })
        )
        if (deletedObject.$metadata.httpStatusCode === HttpStatus.NO_CONTENT) {
            return deletedObject
        } else {
            this.logger.error(`Error deleting the s3Object Path:${filePath}`)
            return null
        }
    }

    // S3 Services

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

    async sqsImageEmbeddingProcessingDataPush(imageData: SQSImageEmbeddingProcessDTO) {
        const validatedData = await validateInput(imageData, SQSImageEmbeddingProcessDTO)
        if (validatedData.length > 0) {
            const loggerMessage = {
                message: "Invalid Data Passed To Image Processing Queue",
                imageData,
                validatedData
            }
            this.loggingService.warn(JSON.stringify(loggerMessage))
            this.logger.log(loggerMessage.message)
            return
        }

        const data = await this.sqsService.send(AWS_QUEUE_NAMES.IMAGE_EMBEDDING_PROCESS_QUEUE, {
            body: imageData,
            id: Date.now().toString(),
        })
    }

    /**
     * 
     * @param fileData: imageData
     * @param imageMetaData: SharpMetadata
     * @param ImagePaid: boolean
     * @description Validate Image Payload And push to queue
     */
    async sqsImageProcessingDataPush({ fileData, imageSharpMetaData, ImageMetaData, s3_image_path }: SQSImageProcessDTO) {

        if (!s3_image_path) {
            this.logger.log("Temp S3 image is not uploaded")
            return
        }

        // * Uploading original file to s3 because we cannot pass whole buffer to queue

        await this.uploadFile(s3_image_path, fileData.buffer, fileData.mimetype)

        const compresedFileData = {
            ...fileData,
            // * Cannot Send Full buffer to sqs so temp upload file to s3 which will be fetched by worker 
            // * and get deleted after use
            buffer: '' as unknown as Buffer<ArrayBufferLike>,
        }

        const validatedData: SQSImageProcessDTO = {
            fileData: compresedFileData,
            imageSharpMetaData,
            s3_image_path: s3_image_path,
            ImageMetaData
        }

        console.log('validated-->', validatedData);

        await this.sqsService.send(AWS_QUEUE_NAMES.IMAGE_VARIANT_PROCESS_QUEUE, {
            body: JSON.stringify(validatedData),
            id: Date.now().toString(),
        })
        return
    }

    async sqsMessageDelete(messageId: string, queueName: AWS_QUEUE_URLS) {
        if (queueName === AWS_QUEUE_URLS.AWS_SQS_IMAGE_EMBEDDING_QUEUE_URL) {
            await this.sqsClient.send(
                new DeleteMessageCommand({
                    QueueUrl: this.configService.getOrThrow("AWS_SQS_IMAGE_EMBEDDING_QUEUE_URL"),
                    ReceiptHandle: messageId
                })
            )
        } else if (queueName === AWS_QUEUE_URLS.AWS_IMAGE_VARIANT_SQS_QUEUE_URL) {
            await this.sqsClient.send(
                new DeleteMessageCommand({
                    QueueUrl: this.configService.getOrThrow("AWS_IMAGE_VARIANT_SQS_QUEUE_URL"),
                    ReceiptHandle: messageId
                })
            )
        }
        return
    }

    async getSignedUrl(url: string, signedUrlTime: number = 60) {
        try {

            const policyString = getSignedUrlPolicy(url, signedUrlTime)

            const signedUrlParams: CloudfrontSignInputWithPolicy = {
                keyPairId: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID!,
                policy: policyString,
                privateKey: fs.readFileSync("secrets/pk-APKAUS24ORKUJMRTS7TN.pem").toString(),
            }
            const signedUrl = getSignedUrl(signedUrlParams)
            return `${signedUrl}&Key-Pair-Id=${process.env.AWS_CLOUDFRONT_KEY_PAIR_ID}`
        } catch (error) {
            console.log('error-->', error);
        }
    }
}
