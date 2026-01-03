import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FileuploadModule } from 'src/fileupload/fileupload.module';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';

@Module({
  imports: [DrizzleModule, FileuploadModule],
  controllers: [AuthController],
  providers: [AuthService, RedisCacheService]
})
export class AuthModule { }
