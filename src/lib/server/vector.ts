import { and, asc, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { ollama } from './client';
import { db } from './db';
import { document } from './db/schema';

async function embed(content: string[]): Promise<number[][]> {
	const resp = await ollama.embed({
		input: content,
		model: 'bge-m3'
	});

	return resp.embeddings;
}

export async function search(userId: string, text: string) {
	const [embedding] = await embed([text]);

	const similarity = sql<number>`1 - (${cosineDistance(document.embedding, embedding)})`;

	const docs = await db
		.select({
			content: document.content,
			similarity
		})
		.from(document)
		.where(and(eq(document.authorId, userId), gt(similarity, 0.5)))
		.orderBy((t) => desc(t.similarity))
		.limit(1);

	return docs;
}

async function loop() {
	const docs = await db
		.select({
			id: document.id,
			content: document.content
		})
		.from(document)
		.where(eq(document.embeddingNeedsUpdate, true))
		.orderBy(asc(document.embeddingUpdatedAt))
		.limit(3);

	if (docs.length === 0) {
		return;
	}

	const resp = await embed(docs.map((x) => x.content));

	await db.transaction(async (tx) => {
		for (const [i, doc] of docs.entries()) {
			await tx
				.update(document)
				.set({
					embedding: resp[i],
					embeddingUpdatedAt: new Date(),
					embeddingNeedsUpdate: false
				})
				.where(eq(document.id, doc.id));
		}
	});
}

async function main() {
	for (;;) {
		await loop();
		await new Promise((r) => setTimeout(r, 5000));
	}
}

main();
