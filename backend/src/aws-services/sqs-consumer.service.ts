import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import type { Message } from '@aws-sdk/client-sqs';
import { SqsService } from "@ssut/nestjs-sqs"
import { AwsServicesService } from "./aws-services.service"
import { SQSImageEmbeddingProcessDTO, SQSImageProcessDTO } from "./DTO/sqsImageProcessData";
import { LangchainService } from "@src/langchain/langchain.service";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../Schema/schema"
import { DRIZZLE } from "@src/constants";
import { tbl_image_embeddings } from "@src/image/schema/image.schema";
import { eq } from "drizzle-orm";
import { AWS_QUEUE_NAMES, AWS_QUEUE_URLS } from "./aws-service.types";
import { getImagepaths } from "../utils/common"

@Injectable()
export class SqsConsumerService implements OnModuleInit {
    private logger: Logger = new Logger(AwsServicesService.name)
    constructor(
        private readonly awsService: AwsServicesService,
        private readonly langchainService: LangchainService,
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>
    ) {
        console.log("Initialized SQS Polling")
    }

    onModuleInit() {
        console.log("Module Loaded")
    }

    @SqsMessageHandler(AWS_QUEUE_NAMES.IMAGE_EMBEDDING_PROCESS_QUEUE)
    async sqsImageProcessingMessageHandler(message: Message) {
        // Generate embeddings of the image description and store 
        try {
            if (!message.Body) {
                this.logger.log("Empty body received in image processing queue")
                return
            }
            const parsedBody: SQSImageEmbeddingProcessDTO = JSON.parse(message.Body)
            const descriptionEmbeddings = await this.langchainService.getEmbeddedText(parsedBody.description)

            if (!descriptionEmbeddings) {
                this.logger.log(`Error Getting Embeddings for ${parsedBody}`)
                return
            }

            const data = await this.conn.insert(tbl_image_embeddings).values({
                tbl_image_id: parsedBody.image_id,
                image_metadata: descriptionEmbeddings
            })

            await this.conn.update(schema.tbl_image).set({
                image_processed: true
            }).where(
                eq(schema.tbl_image.id, parsedBody.image_id)
            )

            // Can Remove await
            if (message.ReceiptHandle) {
                await this.deleteSqsMessage(message.ReceiptHandle, AWS_QUEUE_URLS.AWS_SQS_IMAGE_EMBEDDING_QUEUE_URL)
            }
            this.logger.log(`Successfully consumed and processed`)
        } catch (error) {
            console.log('error-->', error);
            this.logger.log(`Error Processing ${message.MessageId}, ${message.ReceiptHandle}`)
            return
        }
        return
    }


    @SqsMessageHandler(AWS_QUEUE_NAMES.IMAGE_VARIANT_PROCESS_QUEUE)
    async sqsImageVariantGenerationMessageHandler(message: Message) {
        try {

            if (!message.Body) {
                this.logger.log("Empty body received in image processing queue")
                return
            }

            const parsedData: SQSImageProcessDTO = JSON.parse(message.Body)
            const {
                ImageMetaData: {
                    imageFormat,
                    imageUuid,
                    userId,
                    tempS3Path,
                    is_image_paid
                },
                fileData,
                imageSharpMetaData,
            } = parsedData
            const s3ImagePath = parsedData?.s3_image_path
            if (!s3ImagePath) {
                this.logger.log("S3 image Not uploaded to /tmp")
            }


            const uploadedImage = await this.awsService.getS3FileData(tempS3Path!)
            const imageByteArray = await uploadedImage?.Body?.transformToByteArray()

            const imageBuffer = await Buffer.from(imageByteArray!)

            parsedData.fileData.buffer = imageBuffer
            const {
                imagePreviewPath,
                imageRawPath,
                imageThumbnailPath,
                temp_path,
                waterMarkedImagePath,
                waterMarkedPreviewPath,
                waterMarkedThumbnailPath,
            } = getImagepaths({
                format: imageFormat,
                imageUuid,
                is_paid: is_image_paid,
                userId
            })
            // const thumbnailbuffer = await this.convertImageToThumbnail(fileData, { width: imageMetaData.width, height: imageMetaData.height })
            // const previewImageBuffer = await this.convertImageToPreview(fileData)

            // // TODO - This needs to be go in queue
            // if (reqBody.is_paid) {

            //     const thumbNailMetaData = await this.getImageMetadataFromBuffer(thumbnailbuffer)
            //     const previewImageMetaData = await this.getImageMetadataFromBuffer(previewImageBuffer)


            //     const thumbnailFileData: Express.Multer.File = { ...fileData, buffer: thumbnailbuffer }
            //     const previewFileData: Express.Multer.File = { ...fileData, buffer: previewImageBuffer }


            //     const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbnailFileData, thumbNailMetaData)
            //     const previewWaterMarkedImage = await this.getWatermarkedImage(previewFileData, previewImageMetaData)
            //     // If User uploaded image is premium then create a watermarked image 
            //     // const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbNailMetaData, thumbnailbuffer)
            //     const data = await Promise.allSettled([
            //         this.awsServices.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype),

            //         // TODO: Change Image Buffer TO particular Image E.g. Create buffer for watermarked thumbnail Image
            //         this.awsServices.uploadFile(waterMarkedThumbnailPath!, thumbNailWaterMarkedImage, fileData.mimetype),
            //         this.awsServices.uploadFile(waterMarkedPreviewPath!, previewWaterMarkedImage, fileData.mimetype)
            //     ])

            // }
            // else {
            //     const data = await Promise.allSettled([
            //         this.awsServices.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
            //         this.awsServices.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype)
            //     ])
            // }

            if (message.ReceiptHandle) {
                await this.deleteSqsMessage(message.ReceiptHandle, AWS_QUEUE_URLS.AWS_IMAGE_VARIANT_SQS_QUEUE_URL)
            }

        } catch (error) {
            console.log('error-->', error);
            this.logger.log(`Error Processing ${message.MessageId}, ${message.ReceiptHandle}`)
            return
        }
    }


    private async deleteSqsMessage(receiptHandle: string, queueName: AWS_QUEUE_URLS) {
        await this.awsService.sqsMessageDelete(receiptHandle, queueName)
    }
}