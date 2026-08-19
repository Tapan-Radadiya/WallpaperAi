import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LangchainModule } from '@src/langchain/langchain.module';
import { LoggingModule } from '@src/logging/logging.module';
import { SqsModule } from "@ssut/nestjs-sqs";
import { AwsServicesService } from './aws-services.service';
import './sqs-consumer.service';
import { SqsConsumerService } from './sqs-consumer.service';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    LangchainModule,
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
          },
          {
            name: 'image_variant_generation_std_q',
            queueUrl: configService.getOrThrow("AWS_IMAGE_VARIANT_SQS_QUEUE_URL"),
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
          },
          {
            name: 'image_variant_generation_std_q',
            queueUrl: configService.getOrThrow("AWS_IMAGE_VARIANT_SQS_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
          }
        ]
      })
    })
  ],
  providers: [AwsServicesService, SqsConsumerService],
  exports: [AwsServicesService],
})
export class AwsServicesModule { }
