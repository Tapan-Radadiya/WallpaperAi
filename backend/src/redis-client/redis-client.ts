import Redis from "ioredis";
import { createClient, RedisClientType } from "redis"
// export const redisClient = new Redis({
//     host: '127.0.0.1',
//     port: 6380,
// })


export const redisClient: RedisClientType = createClient({
    url: 'redis://0.0.0.0:6381', // your host/port
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
})

export async function initRedis() {
    if (redisClient.isOpen) {
        await redisClient.connect()
    }
}