import { Controller, Get, HttpStatus, Inject, Injectable, Logger, Req, Res } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import sharp from 'sharp';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { ImageService } from 'src/image/image.service';
import * as schema from "../Schema/schema";
import { ImageUploadBodyDTO } from 'src/DTO/image.dto';
import { AwsServicesService } from 'src/aws-services/aws-services.service';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { LangchainService } from 'src/langchain/langchain.service';
import { RedisCacheService } from 'src/redis_cache/redis_cache.service';

@Controller('data-seed')
@Injectable()
export class DataSeedController {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly imageService: ImageService,
        private readonly awsService: AwsServicesService,
        private readonly lanchainService: LangchainService,
        private readonly redisService: RedisCacheService
    ) { }

    private readonly logger = new Logger(DataSeedController.name)

    private IMAGE_FORMAT_TO_MIME: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
        tiff: 'image/tiff',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
    };

    private testData: ImageUploadBodyDTO[] = [
        {
            is_paid: false,
            category: "Nature",
            hashTags: "#river #nature #flow #landscape",
            description: "A calm river flowing through green countryside.",
            title: "Calm River Flow"
        },
        {
            is_paid: true,
            category: "Nature",
            hashTags: "#cliff #ocean #waves #coast",
            description: "Ocean waves crashing against steep coastal cliffs.",
            title: "Waves on Coastal Cliffs"
        },
        {
            is_paid: false,
            category: "Urban",
            hashTags: "#streetphotography #city #urban #daily",
            description: "Everyday city life captured through street photography.",
            title: "Urban Daily Life"
        },
        {
            is_paid: true,
            category: "Urban",
            hashTags: "#skyline #cityscape #sunset #buildings",
            description: "City skyline during sunset with warm tones.",
            title: "Sunset City Skyline"
        },
        {
            is_paid: false,
            category: "Food",
            hashTags: "#food #healthy #salad #fresh",
            description: "Fresh vegetable salad prepared with natural ingredients.",
            title: "Fresh Healthy Salad"
        },
        {
            is_paid: true,
            category: "Food",
            hashTags: "#restaurant #finefood #gourmet #plating",
            description: "Gourmet dish plated elegantly in a fine dining setting.",
            title: "Fine Dining Presentation"
        },
        {
            is_paid: false,
            category: "Technology",
            hashTags: "#laptop #workspace #coding #desk",
            description: "Minimal coding workspace with laptop and desk items.",
            title: "Minimal Coding Desk"
        },
        {
            is_paid: true,
            category: "Technology",
            hashTags: "#blockchain #crypto #technology #future",
            description: "Conceptual illustration representing blockchain technology.",
            title: "Blockchain Concept"
        },
        {
            is_paid: false,
            category: "People",
            hashTags: "#people #candid #lifestyle #portrait",
            description: "Candid portrait showing natural lifestyle moment.",
            title: "Candid Lifestyle Portrait"
        },
        {
            is_paid: true,
            category: "People",
            hashTags: "#corporate #portrait #professional #business",
            description: "Professional corporate portrait with neutral background.",
            title: "Corporate Profile Portrait"
        },
        {
            is_paid: false,
            category: "Travel",
            hashTags: "#travel #backpacking #adventure #road",
            description: "Backpacker walking along a scenic road.",
            title: "Backpacking Adventure"
        },
        {
            is_paid: true,
            category: "Travel",
            hashTags: "#europe #travel #architecture #tourism",
            description: "Historic European street with classic architecture.",
            title: "Historic European Street"
        },
        {
            is_paid: false,
            category: "Abstract",
            hashTags: "#abstract #shapes #design #modern",
            description: "Modern abstract shapes arranged creatively.",
            title: "Modern Abstract Shapes"
        },
        {
            is_paid: true,
            category: "Abstract",
            hashTags: "#abstract #dark #texture #background",
            description: "Dark abstract texture suitable for premium backgrounds.",
            title: "Dark Abstract Texture"
        },
        {
            is_paid: false,
            category: "Business",
            hashTags: "#coworking #office #startup #team",
            description: "Coworking space filled with startup teams.",
            title: "Coworking Startup Space"
        },
        {
            is_paid: true,
            category: "Business",
            hashTags: "#presentation #boardroom #business #meeting",
            description: "Executive boardroom meeting with presentation screen.",
            title: "Boardroom Presentation"
        },
        {
            is_paid: false,
            category: "Animals",
            hashTags: "#pets #dog #cute #home",
            description: "Pet dog relaxing comfortably at home.",
            title: "Relaxing Pet Dog"
        },
        {
            is_paid: true,
            category: "Animals",
            hashTags: "#wildlife #elephant #nature #safari",
            description: "Elephant walking through natural safari environment.",
            title: "Elephant in the Wild"
        },
        {
            is_paid: false,
            category: "Lifestyle",
            hashTags: "#morning #routine #coffee #home",
            description: "Peaceful morning routine with coffee and sunlight.",
            title: "Morning Coffee Routine"
        },
        {
            is_paid: true,
            category: "Lifestyle",
            hashTags: "#luxury #lifestyle #interior #design",
            description: "Luxury interior showcasing elegant lifestyle design.",
            title: "Luxury Living Space"
        },
        {
            is_paid: false,
            category: "Sports",
            hashTags: "#cycling #fitness #outdoor #sport",
            description: "Cyclist riding on a scenic outdoor trail.",
            title: "Outdoor Cycling Trail"
        },
        {
            is_paid: true,
            category: "Sports",
            hashTags: "#gym #workout #fitness #strength",
            description: "Intense gym workout session focused on strength training.",
            title: "Strength Training Workout"
        },
        {
            is_paid: false,
            category: "Education",
            hashTags: "#education #classroom #students #learning",
            description: "Students engaged in learning inside a classroom.",
            title: "Classroom Learning"
        },
        {
            is_paid: true,
            category: "Education",
            hashTags: "#graduation #education #success #achievement",
            description: "Graduation ceremony celebrating academic success.",
            title: "Graduation Celebration"
        },
        {
            is_paid: false,
            category: "Weather",
            hashTags: "#fog #morning #weather #mist",
            description: "Foggy morning scene with low visibility.",
            title: "Foggy Morning Scene"
        },
        {
            is_paid: true,
            category: "Weather",
            hashTags: "#snowfall #winter #weather #cold",
            description: "Snowfall covering trees and streets in winter.",
            title: "Winter Snowfall"
        },
        {
            is_paid: false,
            category: "Art",
            hashTags: "#sketch #drawing #art #creative",
            description: "Hand-drawn sketch created using pencil.",
            title: "Pencil Sketch Art"
        },
        {
            is_paid: true,
            category: "Art",
            hashTags: "#streetart #graffiti #urban #art",
            description: "Colorful graffiti street art on a city wall.",
            title: "Urban Graffiti Art"
        },
        {
            is_paid: false,
            category: "Cars",
            hashTags: "#classiccar #vintage #automobile #retro",
            description: "Vintage classic car parked on an empty road.",
            title: "Vintage Classic Car"
        },
        {
            is_paid: true,
            category: "Cars",
            hashTags: "#electriccar #ev #future #automotive",
            description: "Modern electric car showcasing futuristic design.",
            title: "Electric Car Future"
        },
        {
            is_paid: false,
            category: "Fashion",
            hashTags: "#streetfashion #style #outfit #urban",
            description: "Street fashion outfit captured in an urban setting.",
            title: "Urban Street Fashion"
        },
        {
            is_paid: true,
            category: "Fashion",
            hashTags: "#runway #fashionweek #designer #luxury",
            description: "High-end fashion runway show during fashion week.",
            title: "Fashion Runway Show"
        },
        {
            is_paid: false,
            category: "Backgrounds",
            hashTags: "#paper #texture #background #simple",
            description: "Paper texture suitable for subtle backgrounds.",
            title: "Paper Texture Background"
        },
        {
            is_paid: true,
            category: "Backgrounds",
            hashTags: "#neon #background #abstract #glow",
            description: "Neon glowing abstract background with vibrant colors.",
            title: "Neon Glow Background"
        },
        {
            is_paid: false,
            category: "Events",
            hashTags: "#conference #event #business #people",
            description: "Business conference with attendees networking.",
            title: "Business Conference Event"
        },
        {
            is_paid: true,
            category: "Events",
            hashTags: "#festival #music #crowd #celebration",
            description: "Outdoor music festival with energetic crowd.",
            title: "Music Festival Crowd"
        },
        {
            is_paid: false,
            category: "Health",
            hashTags: "#health #running #fitness #wellness",
            description: "Person jogging in a park for fitness and wellness.",
            title: "Park Jogging Session"
        },
        {
            is_paid: true,
            category: "Health",
            hashTags: "#nutrition #healthyfood #diet #wellness",
            description: "Healthy nutrition meal prepared with balanced ingredients.",
            title: "Healthy Nutrition Meal"
        },
        {
            is_paid: false,
            category: "Nature",
            hashTags: "#trees #autumn #leaves #season",
            description: "Autumn trees with colorful falling leaves.",
            title: "Autumn Trees"
        },
        {
            is_paid: true,
            category: "Nature",
            hashTags: "#volcano #landscape #nature #dramatic",
            description: "Dramatic volcano landscape with smoke and lava.",
            title: "Volcanic Landscape"
        },

        {
            is_paid: false,
            category: "Nature",
            hashTags: "#meadow #grass #nature #peaceful",
            description: "Open green meadow under a clear blue sky.",
            title: "Green Meadow View"
        },
        {
            is_paid: true,
            category: "Nature",
            hashTags: "#glacier #ice #mountains #cold",
            description: "Massive glacier surrounded by icy mountains.",
            title: "Frozen Glacier Landscape"
        },
        {
            is_paid: false,
            category: "Technology",
            hashTags: "#mobile #app #technology #ui",
            description: "Smartphone displaying a modern mobile application UI.",
            title: "Mobile App Interface"
        },
        {
            is_paid: true,
            category: "Technology",
            hashTags: "#robotics #automation #ai #future",
            description: "Robotic arm working in an automated environment.",
            title: "Robotic Automation"
        },
        {
            is_paid: false,
            category: "People",
            hashTags: "#friends #group #lifestyle #outdoor",
            description: "Group of friends enjoying time outdoors together.",
            title: "Friends Outdoor Moment"
        },
        {
            is_paid: true,
            category: "People",
            hashTags: "#leadership #business #confidence #professional",
            description: "Confident business leader standing in office environment.",
            title: "Business Leadership Portrait"
        },
        {
            is_paid: false,
            category: "Travel",
            hashTags: "#train #journey #travel #window",
            description: "View from a train window during a long journey.",
            title: "Train Journey View"
        },
        {
            is_paid: true,
            category: "Travel",
            hashTags: "#hotairballoon #adventure #sky #travel",
            description: "Hot air balloons floating during sunrise.",
            title: "Hot Air Balloon Adventure"
        },
        {
            is_paid: false,
            category: "Lifestyle",
            hashTags: "#reading #relax #home #comfort",
            description: "Person reading a book in a cozy home setup.",
            title: "Cozy Reading Time"
        },
        {
            is_paid: true,
            category: "Lifestyle",
            hashTags: "#luxurytravel #resort #vacation #premium",
            description: "Luxury resort offering a premium vacation experience.",
            title: "Luxury Resort Stay"
        }
    ]

    @Get('generate-description')
    async addImageEmbeddings(
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (!req.session.userId) {
            return res.status(HttpStatus.BAD_REQUEST).json("No User Logged In")
        }
        try {
            if (!await this.redisService.isKeyExists('imageDescriptionChanges')) {
                console.log("Cache Key Created")
                await this.redisService.setRedisKey(`imageDescriptionChanges`, JSON.stringify([]), 1000000)
            }

            const dataProcessed: string[] = JSON.parse(await this.redisService.getRedisKeyValue(`imageDescriptionChanges`))
            if (dataProcessed.length === 100) {
                console.error("All The Data Processed ")
                return
            }
            const data = await this.conn
                .select({
                    s3ImageUrl: schema.tbl_image.raw_url,
                    imageId: schema.tbl_image.id
                })
                .from(schema.tbl_image)
                .orderBy(sql`random()`)
                .limit(50)

            for await (const element of data) {
                if (dataProcessed.includes(element.imageId)) {
                    console.log({ imageId: element.imageId, message: `dataProcessed Already` })
                    continue
                } else {
                    dataProcessed.push(element.imageId)
                    if (element.s3ImageUrl.includes("/dev")) { continue }

                    const data = await this.lanchainService.getImageDescription(element.s3ImageUrl)
                    await this.conn.update(schema.tbl_image).set({
                        description: data
                    }).where(eq(schema.tbl_image.id, element.imageId))
                }
            }
            await this.redisService.setRedisKey(`imageDescriptionChanges`, JSON.stringify(dataProcessed), 1000000)
            return res.status(HttpStatus.OK).json({ message: "Ok" })
        } catch (error) {
            console.log('error-->', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error })
        }
    }

    @Get('')
    async uploadUserImages(
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            if (!req.session.userId) {
                return res.status(HttpStatus.BAD_REQUEST).json("No User Logged In")
            }
            const userId = req.session.userId
            const start = 0
            const end = 50
            const isUserExists = await this.conn.query.tbl_user.findFirst({
                where: eq(
                    schema.tbl_user.id, userId
                )
            })

            if (!isUserExists) {
                return res.json("User Not Exists")
            }
            if (this.testData.length !== end - start) {
                return res.json("Insufficient Data")
            }

            const imagePath = process.env.SEED_DATA_IMAGES_PATH!

            const data = await fs.readdirSync(imagePath)
            const test: any = []
            for (let index = 0; index <= this.testData.length; index++) {
                const buffer = fs.readFileSync(`${imagePath}/${data[index + start]}`)
                const testdata = await sharp(buffer).metadata()

                const multerData = {
                    buffer,
                    originalname: data[index + start],
                    encoding: '7bit',
                    mimetype: this.IMAGE_FORMAT_TO_MIME[testdata.format],
                    size: testdata.size,
                } as Express.Multer.File

                await this.imageService.uploadUserImageService(this.testData[index], testdata, userId, multerData)
                this.logger.log(`Image: ${index + start} Uploaded ✅`)
            }
            return res.json(test)

        }
        catch (error) {
            console.log('error-->', error);
        }
    }
}
