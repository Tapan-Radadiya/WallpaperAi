import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3002;
  app.enableCors({
    origin: '*',
    method: 'GET'
  })
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.listen(port, '0.0.0.0');

  console.log(`Server Running at port ${port} ✅`);
  console.log(`Accessible at: http://192.168.1.31:${port}`);
  console.log(`Local access: http://localhost:${port}`);
}
bootstrap();
