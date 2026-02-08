import { createClient, RedisClientType } from "redis";
import * as dotenv from "dotenv"
dotenv.config({
    path: `${process.env.NODE_ENV === 'PROD' ? '.env' : '.env.dev'}`
})

export const redisClient: RedisClientType = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
})

redisClient.on('connect', () => {
    console.log(`Connecting To The Redis With Host:${process.env.REDIS_HOST} Port:${process.env.REDIS_PORT}`)
})

redisClient.on('ready', () => {
    console.log("Redis Clinet Connected")
})

redisClient.on('error', (err) => {
    console.log('process.env.NODE_ENV-->', process.env.NODE_ENV);
    console.log('process.env.REDIS_HOST-->', process.env.REDIS_HOST);
    console.error('Redis Client Error', err);
})

export async function initRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect()
    }
}