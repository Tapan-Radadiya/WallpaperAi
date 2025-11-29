import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from "../Schema/schema"
import { GenerateContentResponse, GoogleGenAI } from "@google/genai"
import * as fs from "fs"
import { ConfigService } from '@nestjs/config';
import path from 'path';

@Injectable()
export class GeminiService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly configService: ConfigService
    ) { }

    async generateTextToImage(promt: string) {
        const imagesFolder = path.join(__dirname, '../../../images')

        const ai = new GoogleGenAI({
            apiKey: this.configService.get("GEMINI_API_KEY")
        })

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promt
        })
        if (response?.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    console.log("Response Gemini", part.text)
                }
                if (part.inlineData) {
                    const imageData = part.inlineData.data;
                    if (imageData) {

                        const buffer = Buffer.from(imageData, 'base64')
                        fs.writeFileSync(`${imagesFolder}/${new Date()}.png`, buffer)
                        console.log("Image Saved")
                        return { res: "image saved" }
                    }
                }
            }
        }
    }
}
