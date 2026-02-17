import { timestamp } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { tbl_user } from "src/Schema/schema";

export const aws_sqs_image_data_status = pgTable('aws_sqs_image_data_status', {
    id: uuid('id').defaultRandom(),
    userId: uuid('userId').references(() => tbl_user.id).notNull(),
    pushed_time: timestamp('pushed_time').defaultNow(),
    processed_time: timestamp('processed_time'),
    deleted_time: timestamp('deleted_time'),
    messageGroupId: varchar('messageGroupId'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})