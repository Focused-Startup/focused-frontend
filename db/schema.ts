import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
});

export const drawings = sqliteTable('drawings', {
  id: integer('id').primaryKey(),
  name: text('name'),
  drawingJson: text('drawing_json'),
  previewImage: blob('preview_image'),
});

// Export types
export type Note = typeof notes.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Drawing = typeof drawings.$inferSelect;