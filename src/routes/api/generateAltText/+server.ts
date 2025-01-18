import { groq } from '$lib/server/client';
import { error, json } from '@sveltejs/kit';

export async function POST(event) {
	if (!event.locals.user) {
		return error(403);
	}

	const form = await event.request.formData();
	const image = form.get('image') as string;

	// groq
	const response = await groq.chat.completions.create({
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'Create alt text for this image. It should be brief and at most 100 characters long.'
					},
					{
						type: 'image_url',
						image_url: {
							url: image
						}
					}
				]
			}
		],
		model: 'llama-3.2-11b-vision-preview'
	});

	return json({
		altText: response.choices[0].message.content!
	});
}
