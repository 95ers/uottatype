import { groq, solace } from '$lib/server/client';
import type { WrappedAction } from '$lib';
import { db } from './db';
import { document } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import type { FileLike } from 'groq-sdk/uploads';

solace.subscribeJson(
	'95ers/document/*/send',
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

		// Notify all subscribers of the change
		solace.publishJson(`95ers/document/${id}/update`, {
			userId,
			action
		});
	}
);

solace.subscribe('95ers/document/*/transcribe/*', async (message, topic) => {
	const userId = message.getUserData();
	const [docId, _, lang] = topic.split('/').slice(2);

	const bytes = message.getBinaryAttachment() as Uint8Array;
	const blob = new Blob([bytes], {
		type: 'audio/m4a'
	}) as unknown as FileLike;

	blob.lastModified = Date.now();
	blob.name = `transcription-${docId}-${lang}.m4a`;

	const response = await groq.audio.transcriptions.create({
		file: blob,
		model: 'whisper-large-v3-turbo',
		response_format: 'json',
		language: lang
	});
});
