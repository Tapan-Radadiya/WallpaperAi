import { Module } from '@nestjs/common';
import { ImageSearchController } from './image-search.controller';
import { ImageSearchService } from './image-search.service';
import { LangchainService } from '@src/langchain/langchain.service';

@Module({
  controllers: [ImageSearchController],
  providers: [ImageSearchService, LangchainService]
})
export class ImageSearchModule { }
