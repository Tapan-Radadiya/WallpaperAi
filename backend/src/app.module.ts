import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    DrizzleModule,
    NodePgDatabase,
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
