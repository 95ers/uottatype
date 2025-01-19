import {
	pgTable,
	text,
	integer,
	timestamp,
	uuid,
	primaryKey,
	vector,
	boolean
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const document = pgTable('document', {
	id: uuid('id').primaryKey().defaultRandom(),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	embedding: vector('embedding', { dimensions: 1024 }),
	embeddingUpdatedAt: timestamp('embedding_updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	embeddingNeedsUpdate: boolean('embedding_needs_update').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const documentAccess = pgTable(
	'document_access',
	{
		documentId: uuid('document_id')
			.notNull()
			.references(() => document.id),
		userId: text('user_id')
			.notNull()
			.references(() => user.id)
	},
	(t) => [primaryKey({ columns: [t.documentId, t.userId] })]
);

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Document = typeof document.$inferSelect;
