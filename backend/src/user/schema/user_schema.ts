import { jsonb } from "drizzle-orm/pg-core";
import { uuid, pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";

export const tbl_user = pgTable('tbl_user', {
    id: uuid('id').defaultRandom().primaryKey(),
    display_name: varchar('display_name').notNull().unique(),
    email_id: varchar('email_id').notNull().unique(),
    avatar: varchar('avatar').notNull(),
    password: varchar('password').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_unsplash_users = pgTable('tbl_unsplash_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    unsplash_user_id: varchar('unsplash_user_id').notNull().unique(),
    userName: varchar('userName').notNull(),
    name: varchar('name').notNull(),
    portfolio_url: varchar('portfolio_url').notNull()
})

export const tbl_unsplash_images = pgTable('tbl_unsplash_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    unsplash_user_id: varchar('unsplash_user_id').notNull().references(() => tbl_unsplash_users.unsplash_user_id),
    unsplash_id: varchar('unsplash_id').notNull(),
    image_width: integer('image_width').notNull(),
    image_height: integer('image_height').notNull(),
    image_urls: jsonb('image_urls'),
    alt_text: varchar('alt_text').notNull(),
    description: varchar('description').notNull(),
    created_at: timestamp('created_at').notNull()
})