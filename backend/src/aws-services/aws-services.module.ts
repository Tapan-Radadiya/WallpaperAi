import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LangchainModule } from '@src/langchain/langchain.module';
import { LoggingModule } from '@src/logging/logging.module';
import { SqsModule } from "@ssut/nestjs-sqs";
import { AwsServicesService } from './aws-services.service';
import './sqs-consumer.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { AWS_QUEUE_NAMES } from './aws-service.types';
import { ImageModule } from '@src/image/image.module';

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
            name: AWS_QUEUE_NAMES.IMAGE_EMBEDDING_PROCESS_QUEUE as string,
            queueUrl: configService.getOrThrow("AWS_SQS_IMAGE_EMBEDDING_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
            batchSize: 1,
            waitTimeSeconds: 5,
          },
          {
            name: AWS_QUEUE_NAMES.IMAGE_VARIANT_PROCESS_QUEUE,
            queueUrl: configService.getOrThrow("AWS_IMAGE_VARIANT_SQS_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
            batchSize: 1,
            waitTimeSeconds: 5,
          }
        ],
        producers: [
          {
            name: AWS_QUEUE_NAMES.IMAGE_EMBEDDING_PROCESS_QUEUE as string,
            queueUrl: configService.getOrThrow("AWS_SQS_IMAGE_EMBEDDING_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
          },
          {
            name: AWS_QUEUE_NAMES.IMAGE_VARIANT_PROCESS_QUEUE,
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
