import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { document, documentAccess } from '../lib/server/db/schema';
import { eq, exists } from 'drizzle-orm';
import { error, redirect, type Actions } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return error(404);
	}

	const myDocs = await db
		.select()
		.from(document)
		.where(eq(document.authorId, event.locals.user.id));

	const sharedDocs = await db
		.select()
		.from(document)
		.where(
			exists(
				db.select().from(documentAccess).where(eq(documentAccess.userId, event.locals.user.id))
			)
		);

	return { myDocs, sharedDocs };
};

export const actions = {
	createDocument: async (event) => {
		if (!event.locals.user) {
			return error(403);
		}

		const [doc] = await db
			.insert(document)
			.values({ authorId: event.locals.user.id, title: 'Untitled document', content: '' })
			.returning({ id: document.id });

		return redirect(301, `/document/${doc.id}`);
	}
} satisfies Actions;
