import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { document, documentAccess } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

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

	return { doc };
};
