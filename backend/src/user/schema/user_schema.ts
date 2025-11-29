import { uuid, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const tbl_user = pgTable('tbl_user', {
    id: uuid('id').defaultRandom().primaryKey(),
    display_name: varchar('display_name').notNull(),
    email_id: varchar('email_id').notNull(),
    avatar: varchar('avatar').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})