import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"

@Injectable()
export class LangchainService {

    private embedding: GoogleGenerativeAIEmbeddings
    private logger: Logger
    constructor() {
        this.embedding = new GoogleGenerativeAIEmbeddings({
            model: process.env.LANGCHAIN_MODEL,
            apiKey: process.env.AI_MODEL_API_KEY,


        })
    }

    async getEmbeddedText(text: string): Promise<number[] | null> {
        if (!text) {
            this.logger.log("No text provided for embeddings")
            return null
        }
        if (typeof text !== 'string') {
            this.logger.log("Only string can be embedded in this function")
            return null
        }
        const embededData = await this.embedding.embedQuery(text)
        return embededData
    }
}
