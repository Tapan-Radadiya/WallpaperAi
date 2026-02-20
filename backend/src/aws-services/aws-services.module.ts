import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from "@ssut/nestjs-sqs";
import { AwsServicesService } from './aws-services.service';
import { SqsConsumerService } from './sqs-consumer.service';

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
            queueUrl: configService.getOrThrow("AWS_SQS_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
            batchSize: 1
          }
        ],
        producers: [
          {
            name: "wallpaper_ai_fifo_sqs",
            queueUrl: configService.getOrThrow("AWS_SQS_QUEUE_URL"),
            region: configService.getOrThrow("AWS_REGION"),
          }
        ],
        logger: console
      })
    })
  ],
  providers: [AwsServicesService, ConfigService, SqsConsumerService],
  exports: [AwsServicesService],
})
export class AwsServicesModule { }
