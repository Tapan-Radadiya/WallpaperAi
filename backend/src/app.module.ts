import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserModule } from './user/user.module';
import { GeminiModule } from './gemini/gemini.module';
import { RedisCacheModule } from './redis_cache/redis_cache.module';
import { ImageModule } from './image/image.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkerModule } from './worker/worker.module';
import { FileuploadModule } from './fileupload/fileupload.module';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { ImageController } from './image/image.controller';
import { UserController } from './user/user.controller';
import { UserVerificationController } from './user_verification/user_verification.controller';
import { UserVerificationService } from './user_verification/user_verification.service';
import { UserVerificationModule } from './user_verification/user_verification.module';
import { MailModule } from './mail/mail.module';
import { AwsServicesModule } from './aws-services/aws-services.module';
import { DataSeedController } from './data_seed/data_seed.controller';
import { DataSeedModule } from './data_seed/data_seed.module';
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { APP_GUARD } from '@nestjs/core';
import { LangchainModule } from './langchain/langchain.module';
import { LangchainService } from './langchain/langchain.service';
import { ImageSearchModule } from './image-search/image-search.module';
import { StripeModule } from './stripe/stripe.module';
@Module({
  imports: [
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
  ],
  controllers: [AppController, UserVerificationController, DataSeedController],
  providers: [
    AppService,
    UserVerificationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
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
        { path: '/data-seed', method: RequestMethod.GET }
      )
      .forRoutes(ImageController, UserController)
  }
}
