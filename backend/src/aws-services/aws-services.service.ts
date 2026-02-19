import { CloudFrontClient, CreateInvalidationCommand, ListInvalidationsCommand } from "@aws-sdk/client-cloudfront";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"
import { Consumer } from 'sqs-consumer'
@Injectable()
export class AwsServicesService implements OnModuleInit, OnModuleDestroy {
    private s3Client: S3Client
    private cloudFrontClient: CloudFrontClient
    private sqsClient: SQSClient
    private sqsConsumer;

    constructor(
        private readonly configService: ConfigService
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

    async sqsPush(messageGroupId: string) {
        console.log("Pushing Datattatat")
        const data = await this.sqsClient.send(
            new SendMessageCommand({
                MessageBody: 'This Is For Testing',
                QueueUrl: this.configService.getOrThrow("AWS_SQS_QUEUE_URL"),
                MessageGroupId: messageGroupId,
                MessageDeduplicationId: 'test'
            })
        )
        console.log('data-->', data);
        console.log("Data Pushed")
    }

    async sqsMessageDelete(messageId: string) {
        console.log(`Deleteting: ${messageId} `)
        await this.sqsClient.send(
            new DeleteMessageCommand({
                QueueUrl: this.configService.getOrThrow("AWS_SQS_QUEUE_URL"),
                ReceiptHandle: messageId
            })
        )
    }

    // For continuous SQS Polling
    onModuleInit() {
        console.log("SQS Polling Enabled")
        this.sqsConsumer = Consumer.create({
            queueUrl: this.configService.getOrThrow("AWS_SQS_QUEUE_URL"),
            sqs: this.sqsClient,
            batchSize: 1,
            handleMessage: async (message) => {
                const receiptHandle = message.ReceiptHandle
                console.log('Received message:', message.Body);

                const parsed = message.Body!;

                console.log('parsed-->', parsed);
                if (receiptHandle)
                    this.sqsMessageDelete(receiptHandle)

                return undefined
            },
        })
        this.sqsConsumer.start(); // 🔥 Starts continuous polling
    }
    onModuleDestroy() {
        this.sqsConsumer.stop();
    }
}
