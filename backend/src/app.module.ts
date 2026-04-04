import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AwsServicesModule } from './aws-services/aws-services.module';
import { DataSeedController } from './data_seed/data_seed.controller';
import { DataSeedModule } from './data_seed/data_seed.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { FileuploadModule } from './fileupload/fileupload.module';
import { GeminiModule } from './gemini/gemini.module';
import { ImageSearchModule } from './image-search/image-search.module';
import { ImageController } from './image/image.controller';
import { ImageModule } from './image/image.module';
import { LangchainModule } from './langchain/langchain.module';
import { LoggingModule } from './logging/logging.module';
import { MailModule } from './mail/mail.module';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { RedisCacheModule } from './redis_cache/redis_cache.module';
import { StripeModule } from './stripe/stripe.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { UserVerificationController } from './user_verification/user_verification.controller';
import { UserVerificationModule } from './user_verification/user_verification.module';
import { UserVerificationService } from './user_verification/user_verification.service';
import { WorkerModule } from './worker/worker.module';
import { MetricsModule } from './metrics/metrics.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new LokiTransport({
          host: 'http://192.168.1.31:3100',
          labels: { app: 'wallpaper_backend_app' },
          json: true
        }),
        new winston.transports.Console()
      ]
    }),
    PrometheusModule.register({
      path: "/logging/metrics/prometheus/logs"
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 40
        }
      ]
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.env.NODE_ENV === 'PROD' ? `.env` : `.env.dev`}`
    }),
    ScheduleModule.forRoot(),
    DrizzleModule,
    NodePgDatabase,
    UserModule,
    GeminiModule,
    RedisCacheModule,
    ImageModule,
    WorkerModule,
    FileuploadModule,
    AuthModule,
    UserVerificationModule,
    MailModule,
    AwsServicesModule,
    DataSeedModule,
    LangchainModule,
    ImageSearchModule,
    StripeModule,
    LoggingModule,
    MetricsModule,
  ],
  controllers: [AppController, UserVerificationController, DataSeedController],
  providers: [
    AppService,
    UserVerificationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
      .exclude(
        '/auth',
        '/image/data',
        { path: '/user-verification', method: RequestMethod.POST },
        { path: '/image/image-data/*path', method: RequestMethod.GET },
        { path: '/image/update-download-count/*path', method: RequestMethod.PATCH },
        { path: '/user/username-exists/*path', method: RequestMethod.GET },
        { path: '/user/useremail-exists/*path', method: RequestMethod.GET },
        { path: '/data-seed', method: RequestMethod.GET },
        { path: '/image/process-image', method: RequestMethod.POST }
      )
      .forRoutes(ImageController, UserController)
  }
}
