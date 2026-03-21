import { GenerativeModel, GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage } from "@langchain/core/messages";

@Injectable()
export class LangchainService {

    private embedding: GoogleGenerativeAIEmbeddings
    private chatModel: ChatGoogleGenerativeAI
    private readonly logger = new Logger(LangchainService.name)
    private genAI = new GoogleGenerativeAI(process.env.AI_MODEL_API_KEY!)
    private model: GenerativeModel
    constructor() {
        this.embedding = new GoogleGenerativeAIEmbeddings({
            model: process.env.LANGCHAIN_MODEL,
            apiKey: process.env.AI_MODEL_API_KEY,
            taskType: TaskType.RETRIEVAL_DOCUMENT
        })

        this.chatModel = new ChatGoogleGenerativeAI({
            model: process.env.LANGCHAIN_CHAT_MODEL!,
            temperature: 0,
            apiKey: process.env.AI_MODEL_API_KEY
        })

        this.model = this.genAI.getGenerativeModel({
            model: process.env.GOOGLE_MODEL!,
        })
    }


    async getImageDescription(s3ImagePath: string) {
        try {
            console.log('Image Path: ', `${process.env.AWS_CLOUDFRONT}${s3ImagePath}`);
            const test = await this.model.generateContent([
                {
                    text: "Give me a one-line description of this image",
                },
                {
                    fileData: {
                        fileUri: `${process.env.AWS_CLOUDFRONT}${s3ImagePath}`,
                        mimeType: ""
                    }
                },
            ])
            console.log(test.response.text())
            return test.response.text()
        } catch (error) {
            console.log('error-->', error);
            return
        }
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
