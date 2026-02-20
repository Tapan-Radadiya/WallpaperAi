import { Injectable, OnModuleInit } from "@nestjs/common";
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import type { Message } from '@aws-sdk/client-sqs';
import { SqsService } from "@ssut/nestjs-sqs"

@Injectable()
export class SqsConsumerService implements OnModuleInit {
    constructor(
        private readonly sqsService: SqsService
    ) {
        console.log("Initialized SQS Polling")
    }
    onModuleInit() {
        console.log("Module Loaded")
    }

    @SqsMessageHandler('wallpaper_ai_fifo_sqs', false)
    async sqsMessageHandler(message: Message) {
        console.log('message-->', message);
    }
}