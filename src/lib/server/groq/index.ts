import { groq } from '$lib/client';
import fs from 'fs';

export async function getGroqChatCompletion() {
	return await client.chat.completions.create({
		messages: [{ role: 'user', content: 'Explain the importance of low latency LLMs' }],
		model: 'llama3-8b-8192'
	});
}

export async function getGroqAudioTranscription() {
	const transcription = await groq.audio.transcriptions.create({
		file: fs.createReadStream('sample_audio.m4a'), // Required path to audio file - replace with your audio file!
		model: 'whisper-large-v3-turbo', // Required model to use for transcription
		response_format: 'json', // Optional
		language: 'en', // Optional
		temperature: 0.0 // Optional
	});
	// Log the transcribed text
	return transcription.text;
}
