import { createClient, RedisClientType } from "redis";
import * as dotenv from "dotenv"
dotenv.config()

export const redisClient: RedisClientType = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
})

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
})

export async function initRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect()
    }
}