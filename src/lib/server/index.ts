import { groq, solace } from '$lib/server/client';
import type { Authenticated, Updates } from '$lib';
import { db } from './db';
import { document } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import type { FileLike } from 'groq-sdk/uploads';
import fs from 'fs';

solace.subscribeJson(
	'95ers/document/*/send',
	async ({ action: updates, userId }: Authenticated<Updates>, topic: string) => {
		const id = topic.split('/')[2];

		console.log('start');

		await db.transaction(async (db) => {
			const [doc] = await db.select().from(document).for('update').where(eq(document.id, id));

			if (!doc) {
				return;
			}

			for (const update of updates) {
				if (update.type === 'insert') {
					doc.content =
						doc.content.slice(0, update.index) + update.text + doc.content.slice(update.index);
				} else if (update.type === 'delete') {
					doc.content =
						doc.content.slice(0, update.index) + doc.content.slice(update.index + update.offset);
				}
			}

			console.log(doc.content);

			await db
				.update(document)
				.set({
					content: doc.content
				})
				.where(eq(document.id, id));
		});

		// Notify all subscribers of the change
		solace.publishJson(`95ers/document/${id}/update`, {
			userId,
			action: updates
		});
	}
);

solace.subscribe('95ers/document/*/transcribe', async (message, topic) => {
	const userId = message.getUserData();
	const [docId] = topic.split('/').slice(2);

	const bytes = message.getBinaryAttachment() as Uint8Array;
	const blob = new Blob([bytes], {
		type: 'audio/webm; codecs=opus'
	}) as unknown as FileLike;

	// @ts-expect-error - ok
	blob.lastModified = Date.now();
	// @ts-expect-error - ok
	blob.name = `transcription-${docId}-${userId}.mp3`;

	try {
		const response = await groq.audio.transcriptions.create({
			file: blob,
			model: 'whisper-large-v3-turbo'
		});

		solace.publishJson(`95ers/document/${docId}/update`, {
			userId: 'system',
			action: [
				{
					type: 'insert',
					index: 0,
					text: response.text
				}
			]
		});
	} catch (e) {
		console.log(e);
	}
});
