import { Module } from '@nestjs/common';
import { FileuploadService } from './fileupload.service';

@Module({
  providers: [FileuploadService],
  exports: [FileuploadService]
})
export class FileuploadModule { }
