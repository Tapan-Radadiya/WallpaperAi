import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from "express-session";
import { initRedis, redisClient } from './redis-client/redis-client';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3002;


  await initRedis()

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'sess:'
  })

  app.enableCors({
    origin: 'http://192.168.56.1:3000/',
    credentials: true
  })

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))


  app.use(
    session({
      store: redisStore,
      secret: 'LIONLOVESGRASS',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000000000,
        httpOnly: true,
        sameSite: 'lax',
        secure: false
      }
    })
  )
  await app.listen(port, '0.0.0.0');

  console.log(`Server Running at port ${port} ✅`);
  console.log(`Accessible at: http://192.168.1.31:${port}`);
  console.log(`Local access: http://localhost:${port}`);
}
bootstrap();
