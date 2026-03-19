import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LangchainService {

    private embedding: GoogleGenerativeAIEmbeddings
    private readonly logger = new Logger(LangchainService.name)
    private genAI = new GoogleGenerativeAI(process.env.AI_MODEL_API_KEY!)
    constructor() {
        this.embedding = new GoogleGenerativeAIEmbeddings({
            model: process.env.LANGCHAIN_MODEL,
            apiKey: process.env.AI_MODEL_API_KEY,
            taskType: TaskType.RETRIEVAL_DOCUMENT
        })

        this.genAI.getGenerativeModel({
            model: process.env.LANGCHAIN_MODEL!
        })
    }

    async getEmbeddedText(text: string): Promise<number[] | null> {
        try {
            if (!text) {
                this.logger.log("No text provided for embeddings")
                return null
            }
            if (typeof text !== 'string') {
                this.logger.log("Only string can be embedded in this function")
                return null
            }
            const embededData = await this.embedding.embedQuery(text)

            return embededData.splice(0, 768)
        } catch (error) {
            console.log('error-->', error);
            return null
        }
    }
}
