import { Controller, Get, HttpStatus, Inject, Injectable, Logger, Req, Res } from '@nestjs/common';
import { eq, inArray, not, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import sharp from 'sharp';
import { DRIZZLE } from '@src/constants';
import { ImageService } from '@src/image/image.service';
import * as schema from "../Schema/schema";
import { ImageUploadBodyDTO } from '@src/DTO/image.dto';
import { AwsServicesService } from '@src/aws-services/aws-services.service';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { LangchainService } from '@src/langchain/langchain.service';
import { RedisCacheService } from '@src/redis_cache/redis_cache.service';
import { WorkerService } from '@src/worker/worker.service';
import { Readable } from 'stream';
@Controller('data-seed')
@Injectable()
export class DataSeedController {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly imageService: ImageService,
        private readonly awsService: AwsServicesService,
        private readonly lanchainService: LangchainService,
        private readonly redisService: RedisCacheService,
        private readonly workerService: WorkerService
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
            category: 'Technology',
            hashTags: '#ai #innovation #futuretech #gadgets',
            description: 'Exploring cutting-edge AI tools transforming everyday life.',
            title: 'AI Tools Revolution',
            price: 0
        },
        {
            is_paid: true,
            category: 'Food',
            hashTags: '#streetfood #foodie #tasty #localflavors',
            description: 'A journey through the most delicious street food spots.',
            title: 'Street Food Fiesta',
            price: 229
        },
        {
            is_paid: false,
            category: 'Fitness',
            hashTags: '#workout #gym #healthylife #fit',
            description: 'Daily workout routines to keep you active and healthy.',
            title: 'Fitness Motivation',
            price: 0
        },
        {
            is_paid: true,
            category: 'Education',
            hashTags: '#learning #onlinecourses #skills #education',
            description: 'Top online courses to boost your career skills.',
            title: 'Skill Up Online',
            price: 126
        },
        {
            is_paid: false,
            category: 'Travel',
            hashTags: '#wanderlust #travelgram #adventure #explore',
            description: 'Hidden gems around the world waiting to be explored.',
            title: 'Hidden Travel Gems',
            price: 0
        },
        {
            is_paid: true,
            category: 'Finance',
            hashTags: '#investing #money #finance #wealth',
            description: 'Smart investment strategies for long-term wealth.',
            title: 'Wealth Building Tips',
            price: 204
        },
        {
            is_paid: false,
            category: 'Gaming',
            hashTags: '#gaming #esports #gamerlife #fun',
            description: 'Latest trends and updates from the gaming world.',
            title: 'Gaming Buzz',
            price: 0
        },
        {
            is_paid: true,
            category: 'Fashion',
            hashTags: '#style #fashion #trendy #outfits',
            description: 'Seasonal fashion trends you shouldn’t miss.',
            title: 'Trendy Looks 2026',
            price: 368
        },
        {
            is_paid: false,
            category: 'Health',
            hashTags: '#wellness #healthtips #mindbody #selfcare',
            description: 'Simple habits for a healthier lifestyle.',
            title: 'Healthy Living Guide',
            price: 0
        },
        {
            is_paid: true,
            category: 'Photography',
            hashTags: '#photography #camera #creative #shots',
            description: 'Tips to capture stunning photos like a pro.',
            title: 'Photography Mastery',
            price: 163
        },
        {
            is_paid: false,
            category: 'Music',
            hashTags: '#musiclover #playlist #songs #vibes',
            description: 'Curated playlists for every mood and moment.',
            title: 'Daily Music Vibes',
            price: 0
        },
        {
            is_paid: true,
            category: 'Business',
            hashTags: '#startup #entrepreneur #business #growth',
            description: 'Insights to grow and scale your startup.',
            title: 'Startup Success',
            price: 97
        },
        {
            is_paid: false,
            category: 'DIY',
            hashTags: '#diy #crafts #creative #homemade',
            description: 'Fun and creative DIY ideas for your home.',
            title: 'DIY Creations',
            price: 0
        },
        {
            is_paid: true,
            category: 'Parenting',
            hashTags: '#parenting #kids #family #tips',
            description: 'Helpful parenting tips for modern families.',
            title: 'Smart Parenting',
            price: 441
        },
        {
            is_paid: false,
            category: 'Automotive',
            hashTags: '#cars #automotive #driving #vehicles',
            description: 'Latest updates and reviews from the car industry.',
            title: 'Auto Insights',
            price: 0
        },
        {
            is_paid: true,
            category: 'Real Estate',
            hashTags: '#realestate #property #investment #homes',
            description: 'Guide to smart property investments.',
            title: 'Property Guide',
            price: 173
        },
        {
            is_paid: false,
            category: 'Art',
            hashTags: '#art #creative #design #artist',
            description: 'Showcasing inspiring artwork from around the world.',
            title: 'Art Showcase',
            price: 0
        },
        {
            is_paid: true,
            category: 'Movies',
            hashTags: '#movies #cinema #film #entertainment',
            description: 'Latest movie reviews and recommendations.',
            title: 'Movie Mania',
            price: 139
        },
        {
            is_paid: false,
            category: 'Science',
            hashTags: '#science #research #innovation #discovery',
            description: 'New scientific discoveries shaping the future.',
            title: 'Science Today',
            price: 0
        },
        {
            is_paid: true,
            category: 'Spirituality',
            hashTags: '#meditation #spiritual #mindfulness #peace',
            description: 'Practices to bring peace and clarity to your life.',
            title: 'Mindful Living',
            price: 292
        },
        {
            is_paid: false,
            category: 'Pets',
            hashTags: '#pets #animals #cute #petcare',
            description: 'Tips to take better care of your furry friends.',
            title: 'Pet Care Guide',
            price: 0
        },
        {
            is_paid: true,
            category: 'Gardening',
            hashTags: '#plants #gardening #nature #green',
            description: 'Grow your own garden with these simple tips.',
            title: 'Green Living',
            price: 385
        },
        {
            is_paid: false,
            category: 'History',
            hashTags: '#history #past #culture #stories',
            description: 'Exploring fascinating events from the past.',
            title: 'History Uncovered',
            price: 0
        },
        {
            is_paid: true,
            category: 'Marketing',
            hashTags: '#marketing #digital #branding #ads',
            description: 'Modern marketing strategies that drive results.',
            title: 'Marketing Hacks',
            price: 135
        },
        {
            is_paid: false,
            category: 'Writing',
            hashTags: '#writing #blogging #content #creative',
            description: 'Improve your writing skills with these tips.',
            title: 'Writing Skills Boost',
            price: 0
        },
        {
            is_paid: true,
            category: 'Coding',
            hashTags: '#coding #programming #developer #tech',
            description: 'Learn coding with practical real-world examples.',
            title: 'Code Smarter',
            price: 276
        },
        {
            is_paid: false,
            category: 'Relationships',
            hashTags: '#love #relationships #advice #dating',
            description: 'Advice for building strong relationships.',
            title: 'Relationship Talk',
            price: 0
        },
        {
            is_paid: true,
            category: 'Interior Design',
            hashTags: '#interior #design #home #decor',
            description: 'Stylish ideas to decorate your living space.',
            title: 'Home Decor Ideas',
            price: 342
        },
        {
            is_paid: false,
            category: 'Sports',
            hashTags: '#sports #fitness #games #athlete',
            description: 'Latest highlights from the sports world.',
            title: 'Sports Update',
            price: 0
        },
        {
            is_paid: true,
            category: 'Productivity',
            hashTags: '#productivity #focus #work #efficiency',
            description: 'Boost your productivity with proven techniques.',
            title: 'Work Smart',
            price: 147
        },
        {
            is_paid: false,
            category: 'Language',
            hashTags: '#language #learning #communication #skills',
            description: 'Tips to learn new languages faster.',
            title: 'Language Hacks',
            price: 0
        },
        {
            is_paid: true,
            category: 'Events',
            hashTags: '#events #festivals #fun #celebration',
            description: 'Discover exciting events happening near you.',
            title: 'Event Highlights',
            price: 405
        },
        {
            is_paid: false,
            category: 'Environment',
            hashTags: '#environment #eco #green #sustainability',
            description: 'Ways to live a more sustainable lifestyle.',
            title: 'Eco Living',
            price: 0
        },
        {
            is_paid: true,
            category: 'Luxury',
            hashTags: '#luxury #premium #exclusive #lifestyle',
            description: 'Experience the finest things life has to offer.',
            title: 'Luxury Lifestyle',
            price: 210
        },
        {
            is_paid: false,
            category: 'Education Tech',
            hashTags: '#edtech #learning #technology #future',
            description: 'How technology is transforming education.',
            title: 'EdTech Trends',
            price: 0
        },
        {
            is_paid: true,
            category: 'Freelancing',
            hashTags: '#freelance #remote #work #career',
            description: 'Build a successful freelancing career.',
            title: 'Freelance Guide',
            price: 221
        },
        {
            is_paid: false,
            category: 'Comedy',
            hashTags: '#funny #comedy #laugh #entertainment',
            description: 'Daily dose of humor to make you laugh.',
            title: 'Laugh Out Loud',
            price: 0
        },
        {
            is_paid: true,
            category: 'News',
            hashTags: '#news #updates #world #currentaffairs',
            description: 'Stay updated with the latest global news.',
            title: 'Daily News',
            price: 391
        },
        {
            is_paid: false,
            category: 'Astrology',
            hashTags: '#astrology #horoscope #stars #zodiac',
            description: 'Daily horoscope and zodiac insights.',
            title: 'Star Guide',
            price: 0
        },
        {
            is_paid: true,
            category: 'E-commerce',
            hashTags: '#shopping #ecommerce #deals #online',
            description: 'Best deals and tips for online shopping.',
            title: 'Smart Shopping',
            price: 339
        },
        {
            is_paid: false,
            category: 'Cybersecurity',
            hashTags: '#security #cyber #privacy #dataprotection',
            description: 'Learn how to protect your data in the digital world.',
            title: 'Stay Secure Online',
            price: 0
        },
        {
            is_paid: true,
            category: 'Blockchain',
            hashTags: '#blockchain #crypto #technology #web3',
            description: 'Understanding blockchain and its real-world applications.',
            title: 'Blockchain Basics',
            price: 169
        },
        {
            is_paid: false,
            category: 'Cooking',
            hashTags: '#cooking #recipes #foodlover #kitchen',
            description: 'Simple and delicious recipes you can try at home.',
            title: 'Home Cooking Ideas',
            price: 0
        },
        {
            is_paid: true,
            category: 'Mental Health',
            hashTags: '#mentalhealth #wellbeing #selfcare #mind',
            description: 'Tips and techniques to improve mental well-being.',
            title: 'Mind Matters',
            price: 173
        },
        {
            is_paid: false,
            category: 'Adventure',
            hashTags: '#adventure #outdoors #explore #thrill',
            description: 'Exciting outdoor adventures for thrill seekers.',
            title: 'Adventure Awaits',
            price: 0
        },
        {
            is_paid: true,
            category: 'Beauty',
            hashTags: '#beauty #skincare #makeup #glow',
            description: 'Latest beauty tips and skincare routines.',
            title: 'Beauty Secrets',
            price: 88
        },
        {
            is_paid: false,
            category: 'Robotics',
            hashTags: '#robotics #automation #ai #future',
            description: 'Discover how robots are changing industries.',
            title: 'Rise of Robots',
            price: 0
        },
        {
            is_paid: true,
            category: 'Public Speaking',
            hashTags: '#speaking #confidence #communication #skills',
            description: 'Improve your public speaking and confidence.',
            title: 'Speak with Confidence',
            price: 180
        },
        {
            is_paid: false,
            category: 'Photography Gear',
            hashTags: '#camera #gear #photography #lens',
            description: 'Best gear recommendations for photographers.',
            title: 'Camera Gear Guide',
            price: 0
        },
        {
            is_paid: true,
            category: 'Space',
            hashTags: '#space #universe #nasa #exploration',
            description: 'Exploring the mysteries of the universe.',
            title: 'Space Discoveries',
            price: 391
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
        // return res.status(HttpStatus.NOT_ACCEPTABLE).json({ message: "Currently not accepting" })
        try {
            if (!await this.redisService.isKeyExists('imageDescriptionChanges')) {
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
                    // if (element.s3ImageUrl.includes("/dev")) { continue }

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


    @Get('seed-embeddings')
    async seedEmbeddings(
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {

            if (!await this.redisService.isKeyExists('imageDescriptionChanges')) {
                await this.redisService.setRedisKey(`imageDescriptionChanges`, JSON.stringify([]), 1000000)
            }
            return res.status(HttpStatus.OK).json({ message: "Restricated By User" })
            const dataProcessed: string[] = JSON.parse(await this.redisService.getRedisKeyValue(`imageDescriptionChanges`))

            const data = await this.conn
                .select({
                    id: schema.tbl_image.id,
                    desc: schema.tbl_image.description,
                    hashTags: schema.tbl_image.hashTags
                })
                .from(schema.tbl_image)
                .where(inArray(schema.tbl_image.id, dataProcessed))

            for await (const element of data) {
                this.awsService.sqsImageProcessingDataPush({
                    description: element.desc,
                    hashTags: element.hashTags,
                    image_id: element.id
                })

            }
            return res.status(HttpStatus.OK).json()
        } catch (error) {
            console.log(error)
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" })
        }
    }

    @Get('')
    async uploadUserImages(
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const data_seed_json_file = `src/data_seed/data_seed.json`
            if (!req.session.userId) {
                return res.status(HttpStatus.BAD_REQUEST).json("No User Logged In")
            }
            const unsplashImageDataAPI = await this.workerService.getUnsplashimage('4')
            // Writing Into File
            fs.writeFileSync(data_seed_json_file, JSON.stringify(unsplashImageDataAPI.data))
            const userId = req.session.userId

            const unsplashImageData = JSON.parse(fs.readFileSync(data_seed_json_file).toString())
            if (Object.keys(unsplashImageData).length === 0) {
                console.log("No Image Data Present")
                return
            }
            // Read the data from data_seed.json file and upload image for test env
            for await (const element of unsplashImageData) {
                const data: any = await fetch(element.urls.raw)
                const filePath = `src/data_seed/images/${element.id}.jpeg`
                if (fs.existsSync(filePath)) {
                    console.log("Same Image Found")
                    continue
                }
                const fileStream = fs.createWriteStream(filePath)

                const imageStream = Readable.fromWeb(data.body)

                await new Promise((resolve: any, reject: any) => {
                    imageStream.pipe(fileStream)
                    imageStream.on('error', reject)
                    fileStream.on('finish', resolve)
                })

                const buffer = fs.readFileSync(filePath)
                const imageSharpMetaData = await sharp(buffer).metadata()

                const multerData = {
                    buffer,
                    originalname: element.id,
                    encoding: '7bit',
                    mimetype: this.IMAGE_FORMAT_TO_MIME[imageSharpMetaData.format],
                    size: imageSharpMetaData.size,
                } as Express.Multer.File

                const imagePaidData = this.shouldImagePaid()

                if (!element.description || element.description === '') {
                    if (!element.alt_description || element.alt_description === '') {
                        console.log("Generating Description")
                    } else {
                        element.description = element.alt_description
                        console.log("Using Alt Description")
                    }
                } else {
                    element.description = await this.lanchainService.getImageDescription(element.urls.raw)
                }

                const imageUploadData: ImageUploadBodyDTO = {
                    is_paid: imagePaidData.is_paid,
                    category: 'Test',
                    hashTags: 'Test',
                    description: element.description,
                    title: element.description.slice(0, 20),
                    price: imagePaidData.price
                }
                console.log({ price: imageUploadData.price, is_paid: imageUploadData.is_paid })
                const uploadData = await this.imageService.uploadUserImageService(imageUploadData, imageSharpMetaData, userId, multerData)
                this.logger.log(`${element.id} Is Successfully Completed`)
                fs.rmSync(filePath)
            }
            fs.writeFileSync('src/data_seed/data_seed.json', JSON.stringify({}))
            if (req.session.userId) {
                return res.status(HttpStatus.BAD_REQUEST).json("No User Logged In")
            }

            return res.json({})

        }
        catch (error) {
            console.log('error-->', error);
        }
    }

    private shouldImagePaid(): { is_paid: boolean, price: number } {
        const number = Math.floor(Math.random() * (200 - 100 + 1)) + 100
        return {
            is_paid: number > 150,
            price: number > 150 ? number : 0
        }
    }
}
