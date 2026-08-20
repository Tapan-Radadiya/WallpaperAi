import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { RedisCacheModule } from '@src/redis_cache/redis_cache.module';
import { WorkerService } from './worker.service';

@Module({
  imports: [RedisCacheModule, HttpModule],
  providers: [WorkerService, NodePgDatabase],
  exports: [WorkerService]
})
export class WorkerModule { }
