import { uuid } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { tbl_user } from "src/Schema/schema";

export const tbl_image = pgTable('tbl_image', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => tbl_user.id).notNull(),
    is_paid: boolean('is_paid').default(false).notNull(),
    category: varchar('category'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    hashTags: varchar('hashTags').notNull(),
    description: varchar('description').notNull(),
    thumbnail_url: varchar('thumbnail_url').notNull(),
    raw_url: varchar('raw_url').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_image_likes = pgTable('tbl_image_likes', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => tbl_user.id).notNull(),
    image_id: uuid('image_id').references(() => tbl_image.id).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
}, (table) => {
    return {
        UniqueConstraint: unique('user-image-like-unique-constraint').on(table.image_id, table.user_id)
    }
})