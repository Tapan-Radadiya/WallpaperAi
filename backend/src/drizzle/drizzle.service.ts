import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DRIZZLE } from '@src/constants';
import { LoggingService } from '@src/logging/logging.service';
import * as schema from "@src/Schema/schema"
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
@Injectable()
export class DrizzleService implements OnModuleInit {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly loggingService: LoggingService
    ) { }
    async onModuleInit() {

        try {
            await this.conn.execute("SELECT 1")
            console.log("Database Connection Successfully ✅")
        } catch (error) {
            const DB_CONN_FAIL = {
                message: `Unable to connect To DB ❌: ${process.env.DATABASE_URL}`,
                stackTrace: JSON.stringify(error)
            }
            this.loggingService.warn(JSON.stringify(DB_CONN_FAIL))
            console.log(DB_CONN_FAIL.message)
        }
    }

}
