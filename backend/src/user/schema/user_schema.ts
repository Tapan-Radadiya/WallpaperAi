import { sql } from "drizzle-orm";
import { jsonb } from "drizzle-orm/pg-core";
import { uuid, pgTable, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const tbl_user = pgTable('tbl_user', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_name: varchar('user_name').notNull().unique(),
    email_id: varchar('email_id').notNull().unique(),
    avatar: varchar('avatar').notNull(),
    password: varchar('password').notNull(),
    user_bio: varchar('user_bio'),
    instagram_id: varchar('instagram_id'),
    portfolio_url: varchar('portfolio_url'),
    is_verified: boolean('is_verified').notNull().default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_unsplash_users = pgTable('tbl_unsplash_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    unsplash_user_id: varchar('unsplash_user_id').notNull().unique(),
    userName: varchar('userName').notNull(),
    name: varchar('name').notNull(),
    portfolio_url: varchar('portfolio_url').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
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
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_email_verfications = pgTable('tbl_email_verfications', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => tbl_user.id).notNull(),
    email_code: varchar('email_code').notNull(),
    expires_at: timestamp('expires_at').default(sql`NOW() + INTERVAL '10 minutes'`),
    user_attempts: integer('user_attempts').notNull().default(0),
    resend_attempts: integer('resend_attempts').notNull().default(0),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_user_reset_tickets = pgTable('tbl_user_reset_tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => tbl_user.id).notNull(),
    userTicket: varchar('userTicket').notNull(),
    expires_at: timestamp('expires_at').default(sql`NOW() + INTERVAL '5 minutes'`),
    created_at: timestamp('created_at').defaultNow(),
})