import { Module } from '@nestjs/common';
import { ImageSearchController } from './image-search.controller';
import { ImageSearchService } from './image-search.service';
import { LangchainModule } from '@src/langchain/langchain.module';

@Module({
  imports: [LangchainModule],
  controllers: [ImageSearchController],
  providers: [ImageSearchService],
  exports: [ImageSearchService]
})
export class ImageSearchModule { }
