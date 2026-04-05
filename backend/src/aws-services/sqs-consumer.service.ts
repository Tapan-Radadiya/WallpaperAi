import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import type { Message } from '@aws-sdk/client-sqs';
import { SqsService } from "@ssut/nestjs-sqs"
import { AwsServicesService } from "./aws-services.service"
import { SQSImageProcessDTO } from "./DTO/sqsImageProcessData";
import { LangchainService } from "@src/langchain/langchain.service";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../Schema/schema"
import { DRIZZLE } from "@src/constants";
import { tbl_image_embeddings } from "@src/image/schema/image.schema";
import { eq } from "drizzle-orm";


@Injectable()
export class SqsConsumerService implements OnModuleInit {
    private logger: Logger
    constructor(
        private readonly sqsService: SqsService,
        private readonly awsService: AwsServicesService,
        private readonly langchainService: LangchainService,
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>
    ) {
        console.log("Initialized SQS Polling")
    }
    onModuleInit() {
        console.log("Module Loaded")
    }

    @SqsMessageHandler('wallpaper_ai_fifo_sqs')
    async sqsImageProcessingMessageHandler(message: Message) {
        // Generate embeddings of the image description and store 
        try {
            if (!message.Body) {
                this.logger.log("Empty body received in image processing queue")
                return
            }
            const parsedBody: SQSImageProcessDTO = JSON.parse(message.Body)

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
            if (message.ReceiptHandle) {
                this.awsService.sqsMessageDelete(message.ReceiptHandle)
            }
        } catch (error) {
            this.logger.log(`Error Processing ${message.MessageId}, ${message.ReceiptHandle}`)
            return
        }
        return
    }
}