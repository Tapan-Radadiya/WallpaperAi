import { Module } from '@nestjs/common';
import { AwsServicesModule } from 'src/aws-services/aws-services.module';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DrizzleModule, AwsServicesModule],
  controllers: [UserController],
  providers: [UserService, RedisCacheService]
})
export class UserModule { }