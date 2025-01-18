import { GROQ_API_KEY } from '$env/static/private';
import {
	PUBLIC_SOLACE_PASSWORD,
	PUBLIC_SOLACE_URL,
	PUBLIC_SOLACE_USERNAME,
	PUBLIC_SOLACE_VPN_NAME
} from '$env/static/public';
import { Client as Solace } from '$lib/pubsub';
import Groq from 'groq-sdk';

export const solace = new Solace({
	url: PUBLIC_SOLACE_URL,
	vpnName: PUBLIC_SOLACE_VPN_NAME,
	userName: PUBLIC_SOLACE_USERNAME,
	password: PUBLIC_SOLACE_PASSWORD
});

export const groq = new Groq({
	apiKey: GROQ_API_KEY
});
