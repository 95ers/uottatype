import {
	GROQ_API_KEY,
	SOLACE_PASSWORD,
	SOLACE_URL,
	SOLACE_USERNAME,
	SOLACE_VPN_NAME
} from '$env/static/private';
import { Client as Solace } from '$lib/pubsub';
import Groq from 'groq-sdk';

export const solace = new Solace({
	url: SOLACE_URL,
	vpnName: SOLACE_VPN_NAME,
	userName: SOLACE_USERNAME,
	password: SOLACE_PASSWORD
});

export const groq = new Groq({
	apiKey: GROQ_API_KEY
});
