import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';

@Module({
  providers: [LangchainService],
  exports: [LangchainService, LangchainModule]
})
export class LangchainModule { }
