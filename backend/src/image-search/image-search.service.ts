import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from "../Schema/schema"
import { LangchainService } from 'src/langchain/langchain.service';
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import { cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
@Injectable()
export class ImageSearchService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly langChainService: LangchainService
    ) { }

    async getSearchImageResults(text: string): Promise<APIResponseInterface> {
        try {
            if (!text) {
                return APIResponse({
                    message: "Please provide search content",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
            const embeddings = await this.langChainService.getEmbeddedText(text)
            if (!embeddings) {
                return APIResponse({
                    message: "Try After Sometime",
                    statusCode: HttpStatus.BAD_REQUEST
                })
            }
            const similarity = sql<number>`1 - (${cosineDistance(schema.tbl_image_embeddings.image_metadata, embeddings)})`
            const similarData = await this.conn
                .select({
                    imageId: schema.tbl_image_embeddings.tbl_image_id,
                    image_metadata: schema.tbl_image_embeddings.image_metadata,
                    imageSource: schema.tbl_image.raw_url
                })
                .from(schema.tbl_image_embeddings)
                .leftJoin(
                    schema.tbl_image,
                    eq(schema.tbl_image.id, schema.tbl_image_embeddings.tbl_image_id)
                )
                .where(gt(similarity, 0.5))
                .orderBy((t) => desc(t.image_metadata))
                .limit(4)
            return APIResponse({
                message: "ok",
                statusCode: HttpStatus.OK,
                data: similarData.map((ele) => {
                    return { image: ele.imageId, source: ele.imageSource }
                })
            })
        } catch (error) {
            return APIResponse({
                message: "internal Server Error",
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR
            })
        }
    }
}
