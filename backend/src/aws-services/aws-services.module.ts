import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from "@ssut/nestjs-sqs";
import { AwsServicesService } from './aws-services.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { LangchainService } from 'src/langchain/langchain.service';

@Module({
  imports: [
    ConfigModule,
    SqsModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        consumers: [
          {
            name: 'wallpaper_ai_fifo_sqs',
            queueUrl: configService.getOrThrow("AWS_SQS_STD_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
            batchSize: 1,
            waitTimeSeconds: 5,
          }
        ],
        producers: [
          {
            name: "wallpaper_ai_fifo_sqs",
            queueUrl: configService.getOrThrow("AWS_SQS_STD_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
          }
        ]
      })
    })
  ],
  providers: [AwsServicesService, ConfigService, SqsConsumerService, LangchainService],
  exports: [AwsServicesService],
})
export class AwsServicesModule { }
