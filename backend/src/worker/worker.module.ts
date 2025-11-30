import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisCacheModule } from 'src/redis_cache/redis_cache.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [RedisCacheModule, HttpModule],
  providers: [WorkerService]
})
export class WorkerModule { }
