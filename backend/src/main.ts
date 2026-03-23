import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from "body-parser";
import { RedisStore } from 'connect-redis';
import session from "express-session";
import { AppModule } from './app.module';
import { initRedis, redisClient } from './redis-client/redis-client';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({
    verify: (req: any, res, buf) => {
      if (req.headers['stripe-signature']) {
        req.rawBody = buf.toString();
      }
    }
  }))

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

  const config = new DocumentBuilder()
    .setTitle('WallpaperAi')
    .setDescription('WallpaperAi Description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  const documentBuilder = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, documentBuilder, {
    useGlobalPrefix: false
  })


  await app.listen(port, '0.0.0.0');

  console.log(`Server Running at port ${port} ✅`);
  console.log(`Accessible at: http://192.168.1.31:${port}`);
  console.log(`Local access: http://localhost:${port}`);
  console.log("Redis Connected")
}
bootstrap();
