import Groq from 'groq-sdk';
import fs from 'fs';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

export async function getGroqChatCompletion() {
  return await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Explain the importance of low latency LLMs' }],
    model: 'llama3-8b-8192',
  });
}

export async function getGroqAudioTranscription() {
	const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream("sample_audio.m4a"), // Required path to audio file - replace with your audio file!
    model: "whisper-large-v3-turbo", // Required model to use for transcription
    prompt: "Specify context or spelling", // Optional
    response_format: "json", // Optional
    language: "en", // Optional
    temperature: 0.0, // Optional
  });
  // Log the transcribed text
  return transcription.text;
}
