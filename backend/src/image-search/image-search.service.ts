import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { LangchainService } from 'src/langchain/langchain.service';
import { APIResponseInterface } from 'src/types/common.types';
import { APIResponse } from 'src/utils/common';
import * as schema from "../Schema/schema";
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
                    imageSource: schema.tbl_image.raw_url,
                    userName: schema.tbl_user.user_name,
                    userId: schema.tbl_user.id,
                    imageDescription: schema.tbl_image.description,
                    imageTitle: schema.tbl_image.title
                })
                .from(schema.tbl_image_embeddings)
                .leftJoin(
                    schema.tbl_image,
                    eq(schema.tbl_image.id, schema.tbl_image_embeddings.tbl_image_id)
                )
                .leftJoin(
                    schema.tbl_user,
                    eq(schema.tbl_user.id, schema.tbl_image.user_id)
                )
                .where(gt(similarity, 0.5))
                .orderBy(desc(similarity))
                .limit(8)

            return APIResponse({
                message: "ok",
                statusCode: HttpStatus.OK,
                data: similarData
            })
        } catch (error) {
            return APIResponse({
                message: "internal Server Error",
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR
            })
        }
    }
}
