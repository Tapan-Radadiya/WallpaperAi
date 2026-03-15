import { uuid } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { tbl_user } from "src/Schema/schema";

export const tbl_image = pgTable('tbl_image', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title').notNull(),
    user_id: uuid('user_id').references(() => tbl_user.id).notNull(),
    is_paid: boolean('is_paid').default(false).notNull(),
    category: varchar('category'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    hashTags: varchar('hashTags').notNull(),
    description: varchar('description').notNull(),
    thumbnail_url: varchar('thumbnail_url').notNull(),
    raw_url: varchar('raw_url').notNull(),
    image_processed: boolean('image_processed').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})


export const tbl_image_embeddings = pgTable('tbl_image_embeddings', {
    id: uuid('id').defaultRandom().primaryKey(),
    tbl_image_id: uuid('tbl_image_id').references(() => tbl_image.id).notNull(),
    image_metadata: vector('image_metadata', { dimensions: 3072 }),
    created_at: timestamp('created_at').defaultNow(),
}, (table) => [
    index("tbl_image_embeddings_tbl_image_idx").using('ivfflat', table.image_metadata.op('vector_cosine_ops'))
])

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

export const tbl_image_downloads = pgTable('tbl_image_downloads', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => tbl_user.id),
    user_ip: varchar('user_ip'),
    image_id: uuid('image_id').references(() => tbl_image.id).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})