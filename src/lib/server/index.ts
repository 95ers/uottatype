import { groq, solace } from '$lib/server/client';
import type { Authenticated, Updates } from '$lib';
import { db } from './db';
import { document } from './db/schema';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';

import './vector';
import { search } from './vector';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions.mjs';

solace.subscribeJson(
	'95ers/document/*/send',
	async ({ action: updates, userId }: Authenticated<Updates>, topic: string) => {
		const id = topic.split('/')[2];

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

			await db
				.update(document)
				.set({
					content: doc.content,
					embeddingNeedsUpdate: true
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

solace.subscribeJson(
	'95ers/document/*/title',
	async ({ action }: Authenticated<string>, topic: string) => {
		const id = topic.split('/')[2];

		await db.update(document).set({ title: action }).where(eq(document.id, id));
	}
);

solace.subscribe('95ers/document/*/transcribe', async (message, topic) => {
	const userId = message.getUserData();
	const [docId] = topic.split('/').slice(2);

	const bytes = message.getBinaryAttachment() as Uint8Array;
	const name = `audio/transcription-${docId}-${userId}-${Date.now()}.webm`;

	fs.writeFileSync(name, bytes);

	try {
		const response = await groq.audio.transcriptions.create({
			file: fs.createReadStream(name),
			model: 'whisper-large-v3-turbo'
		});

		solace.publishJson(`95ers/document/${docId}/send`, {
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
		console.error(e);
	} finally {
		fs.unlinkSync(name);
	}
});

solace.subscribe('95ers/document/*/write', async (message, topic) => {
	const userId = message.getUserData();
	const [docId] = topic.split('/').slice(2);

	const bytes = message.getBinaryAttachment() as Uint8Array;
	const name = `audio/work-${docId}-${userId}-${Date.now()}.webm`;

	fs.writeFileSync(name, bytes);

	try {
		const { text } = await groq.audio.transcriptions.create({
			file: fs.createReadStream(name),
			model: 'whisper-large-v3-turbo'
		});

		const messages: ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `You are a document writing assistant. Output text to be directly added to the document, do not include words like "Here's a suggestion" or "I think", be confident and write.`
			},
			{
				role: 'user',
				content: text
			}
		];

		const response = await groq.chat.completions.create({
			model: 'llama-3.3-70b-versatile',
			messages,
			tools: [
				{
					type: 'function',
					function: {
						name: 'search_documents',
						description: "Search for relevant content in the user's documents.",
						parameters: {
							type: 'object',
							properties: {
								query: {
									type: 'string',
									description: 'The text to search for in the user documents.'
								}
							},
							required: ['query']
						}
					}
				}
			],
			tool_choice: 'auto',
			max_completion_tokens: 4096
		});

		let responseMessage = response.choices[0].message.content;
		const toolCalls = response.choices[0].message.tool_calls;

		if (toolCalls) {
			const functions = {
				search_documents: async (query: string) => {
					const docs = await search(userId, query);

					return docs.map((x) => x.content).join('\n');
				}
			};

			for (const toolCall of toolCalls) {
				let json;

				try {
					json = JSON.parse(toolCall.function.arguments);
				} catch {
					json = {};
				}

				if (json.query) {
					const result = await functions[toolCall.function.name](json.query);

					messages.push({
						tool_call_id: toolCall.id,
						role: 'tool',
						content: result
					});
				}
			}

			const resp = await groq.chat.completions.create({
				model: 'llama-3.3-70b-versatile',
				messages
			});

			responseMessage = resp.choices[0].message.content;
		}

		solace.publishJson(`95ers/document/${docId}/send`, {
			userId: 'system',
			action: [
				{
					type: 'insert',
					index: 0,
					text: responseMessage
				}
			]
		});
	} catch (e) {
		console.error(e);
	} finally {
		try {
			fs.unlinkSync(name);
		} catch {}
	}
});
