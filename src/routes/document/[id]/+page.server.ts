import { error, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { document, documentAccess, user } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { groq } from '$lib/server/client';

export const load: PageServerLoad = async (event) => {
	const [doc] = await db.select().from(document).where(eq(document.id, event.params.id));

	if (!doc || !event.locals.user) {
		return error(404);
	}

	const hasAccess =
		doc.authorId === event.locals.user.id ||
		(
			await db
				.select()
				.from(documentAccess)
				.where(
					and(
						eq(documentAccess.documentId, doc.id),
						eq(documentAccess.userId, event.locals.user.id)
					)
				)
		).length > 0;

	if (!hasAccess) {
		return error(403);
	}

	return { doc, user: event.locals.user! };
};

export const actions = {
	addUser: async (event) => {
		if (!event.locals.user) {
			return error(403);
		}

		const documentId = event.params.id;

		const [doc] = await db
			.select()
			.from(document)
			.where(and(eq(document.id, documentId), eq(document.authorId, event.locals.user.id)));

		if (!doc) {
			return error(403);
		}

		const form = await event.request.formData();
		const username = form.get('username') as string;

		if (!username) {
			return error(400);
		}

		const [u] = await db
			.select({
				id: user.id
			})
			.from(user)
			.where(eq(user.username, username));

		if (!u) {
			return error(404);
		}

		await db.insert(documentAccess).values({
			documentId,
			userId: u.id
		});
	}
} satisfies Actions;
