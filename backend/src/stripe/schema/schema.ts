import { index, integer, pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tbl_image, tbl_user } from "src/Schema/schema";

export const payment_status = pgEnum('payment_status', ['PENDING', 'SUCCESS', 'FAILED'])

export const tbl_payments = pgTable('tbl_payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    amount: integer('amount').notNull(),
    platform_cut: integer('platform_cut').notNull(),
    user_cut: integer('user_cut').notNull(),
    status: payment_status('status').default("PENDING").notNull(),
    buyer_id: uuid('buyer_id').references(() => tbl_user.id).notNull(),
    seller_id: uuid('seller_id').references(() => tbl_user.id).notNull(),
    image_id: uuid('image_id').references(() => tbl_image.id).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
})

export const tbl_purchases = pgTable('tbl_purchases', {
    id: uuid('id').defaultRandom().primaryKey(),
    buyer_id: uuid('buyer_id').references(() => tbl_user.id).notNull(),
    image_id: uuid('image_id').references(() => tbl_image.id).notNull(),
    payment_id: uuid('payment_id').references(() => tbl_payments.id).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date())
}, (table) => {
    return {
        UniqueConstraint: unique('user-purchases-image-unique-constraint').on(
            table.image_id,
            table.buyer_id
        ),
        Index: index('purchases-idx').on(table.buyer_id)
    }
})