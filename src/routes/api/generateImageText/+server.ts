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
						text: 'Return a plain text representation of the text in the image with no styling.'
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

	console.log(response.choices[0].message.content);

	return json({
		imageText: response.choices[0].message.content!
	});
}
