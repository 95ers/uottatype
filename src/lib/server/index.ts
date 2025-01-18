import { client } from '$lib/solace';
import type { WrappedAction } from '$lib';
import { db } from './db';
import { document } from './db/schema';
import { eq, sql } from 'drizzle-orm';

client.subscribe(
	'95ers/document/*/update',
	async ({ action, userId }: WrappedAction, topic: string) => {
		const id = topic.split('/')[2];

		// Update document with id in database
		if (action.type === 'insert') {
			// Insert action.content at action.position
			await db
				.update(document)
				.set({
					content: sql<string>`format('%s%s%s', left(content, ${action.position}), ${action.content}::text, right(content, length(content) - ${action.position}))`
				})
				.where(eq(document.id, id));
		} else {
			// Delete action.content at action.position
			await db
				.update(document)
				.set({
					content: sql<string>`format('%s%s', left(content, ${action.position}), right(content, length(content) - ${action.position}))`
				})
				.where(eq(document.id, id));
		}
	}
);
