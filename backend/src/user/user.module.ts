import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { FileuploadModule } from 'src/fileupload/fileupload.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';

@Module({
  imports: [DrizzleModule, FileuploadModule],
  controllers: [UserController],
  providers: [UserService, RedisCacheService]
})
export class UserModule { }