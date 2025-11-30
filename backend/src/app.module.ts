import { Module } from '@nestjs/common';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
