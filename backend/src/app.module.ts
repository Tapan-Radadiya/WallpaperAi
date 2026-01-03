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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
      .exclude('/auth', '/image/data')
      .forRoutes(ImageController, UserController)
  }
}
