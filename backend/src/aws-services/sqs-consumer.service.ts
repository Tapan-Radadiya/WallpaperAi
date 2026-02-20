import { Injectable, OnModuleInit } from "@nestjs/common";
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import type { Message } from '@aws-sdk/client-sqs';
import { SqsService } from "@ssut/nestjs-sqs"
import { AwsServicesService } from "./aws-services.service"
@Injectable()
export class SqsConsumerService implements OnModuleInit {
    constructor(
        private readonly sqsService: SqsService,
        private readonly awsSerice: AwsServicesService
    ) {
        console.log("Initialized SQS Polling")
    }
    onModuleInit() {
        console.log("Module Loaded")
    }

    @SqsMessageHandler('wallpaper_ai_fifo_sqs')
    async sqsMessageHandler(message: Message) {
        console.log('message-->', message);
    }
}