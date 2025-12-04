import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { FileuploadModule } from 'src/fileupload/fileupload.module';

@Module({
  imports: [DrizzleModule, FileuploadModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule { }