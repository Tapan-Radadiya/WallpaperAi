import { uuid } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { tbl_user } from "src/Schema/schema";

export const tbl_payments = pgTable('tbl_payments', {
    id: uuid('id').defaultRandom().primaryKey(),

})