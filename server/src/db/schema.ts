
import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const mTableTable = pgTable('mTable', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shorthand_definition: text('shorthand_definition').notNull(),
  generated_sql: text('generated_sql').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type MTable = typeof mTableTable.$inferSelect; // For SELECT operations
export type NewMTable = typeof mTableTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { mTable: mTableTable };
