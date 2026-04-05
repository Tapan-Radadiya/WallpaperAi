import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { DrizzleService } from './drizzle.service';
import * as schema from "../Schema/schema"
import { LoggingModule } from '@src/logging/logging.module';
import { LoggingService } from '@src/logging/logging.service';
import { DRIZZLE } from '@src/constants';
@Global()
@Module({
    imports: [ConfigModule, LoggingModule],
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const DB_URL = configService.get("DATABASE_URL")
                const pool = new Pool({
                    connectionString: DB_URL,
                    ssl: {
                        rejectUnauthorized: false
                    }
                })
                try {
                    await pool.query("SELECT 1")
                    console.log("Database Connection Successfully ✅")
                } catch (error) {
                    console.log(`Unable to connect To DB ❌: ${DB_URL}`)
                }
                return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>
            }
        },
        DrizzleService,
        LoggingService
    ],
    exports: [DRIZZLE]
})
export class DrizzleModule { }