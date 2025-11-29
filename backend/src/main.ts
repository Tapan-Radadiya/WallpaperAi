import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`Server Running at port ${port} ✅`);
  console.log(`Accessible at: http://192.168.1.31:${port}`);
  console.log(`Local access: http://localhost:${port}`);
}
bootstrap();
