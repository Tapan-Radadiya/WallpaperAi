import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import * as schema from "../Schema/schema"

export const DRIZZLE = Symbol("drizzle-connection")
@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const DB_URL = configService.get("DATABASE_URL")
                const pool = new Pool({
                    connectionString: DB_URL,
                    ssl: false
                })
                return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>
            }
        }
    ],
    exports: [DRIZZLE]
})
export class DrizzleModule { }