import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MistralAIEmbeddings, ChatMistralAI } from "@langchain/mistralai"
@Injectable()
export class LangchainService {

    // private embedding: GoogleGenerativeAIEmbeddings
    private chatModel: ChatMistralAI
    private readonly logger = new Logger(LangchainService.name)
    private embedding: MistralAIEmbeddings

    constructor() {
        this.embedding = new MistralAIEmbeddings({
            apiKey: process.env.MISTRAL_AI_API_KEY,
            model: 'mistral-embed'
        })

        this.chatModel = new ChatMistralAI({
            apiKey: process.env.MISTRAL_AI_API_KEY,
            model: 'mistral-small-latest'
        })
    }


    async getImageDescription(s3ImagePath: string) {
        try {

            const modelResponse = await this.chatModel.invoke([
                new SystemMessage(`You are an image summarization agent.

Carefully inspect the provided image and summarize ONLY what is visibly present.

Rules:
- Return a concise summary in no more than 2 sentences.
- Do not guess or invent information.
- Do not describe the image URL.
- Focus on the main subject, objects, people, scene, and important visible details.
- If the image is unclear, say that it is unclear rather than guessing.
- Message should feel like that it has been written by the user not too descriptiv.
- Ignore any watermark don't include any watermark if visible in image`),
                new HumanMessage({
                    content: [
                        {
                            type: "text",
                            text: "Summarize this image"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: s3ImagePath
                            }
                        }
                    ]
                })
            ])


            const textModelResponse = modelResponse.content ?? ''
            return textModelResponse.toString()
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
