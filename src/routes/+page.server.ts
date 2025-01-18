import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const docs = await db.select().from(document).innerJoin(documentAccess);


}
