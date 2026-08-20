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
import sharp from 'sharp';

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
            console.log('message-->', message);

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
                this.logger.error("S3 image Not uploaded to /tmp")
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

            this.logger.log(`Image variant Creating Starting For Image Id: ${imageUuid}`)
            const thumbnailbuffer = await this.convertImageToThumbnail(fileData, { width: imageSharpMetaData.width, height: imageSharpMetaData.height })
            const previewImageBuffer = await this.convertImageToPreview(fileData)

            // TODO - This needs to be go in queue
            if (is_image_paid) {

                const thumbNailMetaData = await this.getImageMetadataFromBuffer(thumbnailbuffer)
                const previewImageMetaData = await this.getImageMetadataFromBuffer(previewImageBuffer)


                const thumbnailFileData: Express.Multer.File = { ...fileData, buffer: thumbnailbuffer }
                const previewFileData: Express.Multer.File = { ...fileData, buffer: previewImageBuffer }


                const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbnailFileData, thumbNailMetaData)
                const previewWaterMarkedImage = await this.getWatermarkedImage(previewFileData, previewImageMetaData)
                // If User uploaded image is premium then create a watermarked image 
                // const thumbNailWaterMarkedImage = await this.getWatermarkedImage(thumbNailMetaData, thumbnailbuffer)
                const data = await Promise.allSettled([
                    this.awsService.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
                    this.awsService.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
                    this.awsService.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype),

                    // TODO: Change Image Buffer TO particular Image E.g. Create buffer for watermarked thumbnail Image
                    this.awsService.uploadFile(waterMarkedThumbnailPath!, thumbNailWaterMarkedImage, fileData.mimetype),
                    this.awsService.uploadFile(waterMarkedPreviewPath!, previewWaterMarkedImage, fileData.mimetype)
                ])

            }
            else {
                const data = await Promise.allSettled([
                    this.awsService.uploadFile(imageRawPath, fileData.buffer, fileData.mimetype),
                    this.awsService.uploadFile(imageThumbnailPath, thumbnailbuffer, fileData.mimetype),
                    this.awsService.uploadFile(imagePreviewPath, previewImageBuffer, fileData.mimetype)
                ])
            }

            // TODO : Remove Temp S3 Object After Worker Done Is Job Successfully
            if (message.ReceiptHandle) {
                await this.deleteSqsMessage(message.ReceiptHandle, AWS_QUEUE_URLS.AWS_IMAGE_VARIANT_SQS_QUEUE_URL)
            }
            this.logger.log("Image processing Completed")
        } catch (error) {
            console.log('error-->', error);
            this.logger.log(`Error Processing ${message.MessageId}, ${message.ReceiptHandle}`)
            return
        }
    }


    private async deleteSqsMessage(receiptHandle: string, queueName: AWS_QUEUE_URLS) {
        await this.awsService.sqsMessageDelete(receiptHandle, queueName)
    }

    private async convertImageToThumbnail(imageData: Express.Multer.File, orgImage: { width: number, height: number }): Promise<Buffer> {
        const thumbnailImageWidth = Math.round((orgImage.height / orgImage.width) * 600)
        const thumbNailImage = await sharp(imageData.buffer).resize({ width: thumbnailImageWidth }).toBuffer()
        return thumbNailImage
    }

    private async convertImageToPreview(imageData: Express.Multer.File): Promise<Buffer> {
        const previewWidth = 1400; // perfect for modal previews
        const previewImage = await sharp(imageData.buffer, {
            limitInputPixels: 25_000_000
        })
            .rotate()
            .resize({ width: previewWidth, withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();

        return previewImage;
    }



    /**
     * 
     * @param imageData 
     * @param imageMetaData 
     * @returns 
     */
    private async getWatermarkedImage(imageData: Express.Multer.File, imageMetaData: sharp.Metadata) {
        const waterMark = await sharp('src/public/watermark.png')
            .resize({ width: Math.floor(imageMetaData.width * 0.3) })
            .ensureAlpha(0.3)
            .toBuffer()

        const waterMarkedImage = await sharp(imageData.buffer)
            .composite([{
                input: waterMark,
                gravity: 'center',
                blend: 'overlay'
            }])
            .toBuffer()

        return waterMarkedImage
    }



    /**
     * 
     * @param imageBuffer 
     * @returns Promise<sharp.Metadata>
     */
    private async getImageMetadataFromBuffer(imageBuffer: Buffer<ArrayBufferLike>): Promise<sharp.Metadata> {
        const metaData = await sharp(imageBuffer).metadata()
        return metaData
    }
}